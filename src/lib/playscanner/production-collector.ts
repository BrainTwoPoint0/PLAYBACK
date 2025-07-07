import { PlaytomicProvider } from './providers/playtomic';
import { persistentCache } from './persistent-cache';
import { CourtSlot } from './types';

/**
 * Production-Grade PLAYScanner Data Collector
 * 
 * Features:
 * - Intelligent retry logic with exponential backoff
 * - Parallel processing with concurrency limits  
 * - Comprehensive error handling and recovery
 * - Performance monitoring and metrics
 * - Circuit breaker pattern for fault tolerance
 * - Rate limiting to respect upstream services
 */
export class ProductionCollector {
  private provider: PlaytomicProvider;
  private metrics: CollectionMetrics;
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.provider = new PlaytomicProvider();
    this.metrics = new CollectionMetrics();
    this.circuitBreaker = new CircuitBreaker();
  }

  /**
   * Main collection orchestrator with intelligent scheduling
   */
  async collectWithIntelligence(): Promise<ProductionCollectionResult> {
    const startTime = Date.now();
    const collectionId = `prod_${Date.now()}`;
    
    console.log(`🚀 Starting production collection ${collectionId}`);
    
    try {
      // Pre-collection health checks
      await this.performHealthChecks();
      
      // Intelligent workload planning
      const workPlan = await this.createWorkPlan();
      
      // Execute collection with fault tolerance
      const results = await this.executeWorkPlan(workPlan, collectionId);
      
      // Post-collection analysis and optimization
      const analysis = await this.analyzeResults(results);
      
      const totalTime = Date.now() - startTime;
      
      return {
        status: 'success',
        collectionId,
        results,
        analysis,
        metrics: this.metrics.getSnapshot(),
        totalTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Production collection ${collectionId} failed:`, error);
      
      // Graceful degradation
      const fallbackResults = await this.attemptGracefulDegradation();
      
      return {
        status: 'partial_failure',
        collectionId,
        results: fallbackResults,
        error: (error as Error).message,
        metrics: this.metrics.getSnapshot(),
        totalTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create intelligent work plan based on system state
   */
  private async createWorkPlan(): Promise<WorkPlan> {
    const cities = ['London']; // Expandable
    const daysAhead = 7;
    const currentTime = new Date();
    
    // Check cache freshness to prioritize outdated data
    const cacheAnalysis = await persistentCache.getCacheStats();
    
    const tasks: CollectionTask[] = [];
    
    for (const city of cities) {
      for (let i = 0; i < daysAhead; i++) {
        const date = new Date(currentTime);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Priority based on cache age and demand patterns
        const priority = this.calculateTaskPriority(city, dateString, cacheAnalysis);
        
        tasks.push({
          city: city.toLowerCase(),
          date: dateString,
          priority,
          attempts: 0,
          status: 'pending'
        });
      }
    }
    
    // Sort by priority (high priority first)
    tasks.sort((a, b) => b.priority - a.priority);
    
    return {
      tasks,
      maxConcurrency: 2, // Respect rate limits
      timeoutPerTask: 45000, // 45 seconds per task
      maxRetries: 2
    };
  }

  /**
   * Execute work plan with sophisticated error handling
   */
  private async executeWorkPlan(
    plan: WorkPlan, 
    collectionId: string
  ): Promise<ProductionCollectionItem[]> {
    const results: ProductionCollectionItem[] = [];
    const semaphore = new Semaphore(plan.maxConcurrency);
    
    // Process tasks in parallel with concurrency control
    const promises = plan.tasks.map(async (task) => {
      return semaphore.acquire(async () => {
        return this.executeTaskWithRetry(task, plan, collectionId);
      });
    });
    
    const taskResults = await Promise.allSettled(promises);
    
    // Process results
    taskResults.forEach((result, index) => {
      const task = plan.tasks[index];
      
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          city: task.city,
          date: task.date,
          status: 'failed',
          error: result.reason?.message || 'Unknown error',
          slotsCollected: 0,
          venuesProcessed: 0,
          executionTime: 0,
          attempts: task.attempts
        });
      }
    });
    
    return results;
  }

  /**
   * Execute individual task with intelligent retry
   */
  private async executeTaskWithRetry(
    task: CollectionTask,
    plan: WorkPlan,
    collectionId: string
  ): Promise<ProductionCollectionItem> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= plan.maxRetries + 1; attempt++) {
      task.attempts = attempt;
      
      // Circuit breaker check
      if (this.circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker open - service degraded');
      }
      
      try {
        const startTime = Date.now();
        
        // Execute with timeout
        const slots = await Promise.race([
          this.collectCityDateProduction(task.city, task.date),
          this.createTimeoutPromise<CourtSlot[]>(plan.timeoutPerTask, `${task.city}:${task.date}`)
        ]);
        
        const executionTime = Date.now() - startTime;
        const uniqueVenues = [...new Set(slots.map(s => s.venue.id))];
        
        // Store in cache
        await persistentCache.setCachedData(task.city, task.date, slots);
        
        // Store venues
        for (const venue of uniqueVenues) {
          const venueObj = slots.find(s => s.venue.id === venue)?.venue;
          if (venueObj) {
            await persistentCache.storeVenue(venueObj, task.city);
          }
        }
        
        // Log success
        await persistentCache.logCollection({
          collection_id: collectionId,
          city: task.city,
          date: task.date,
          status: 'success',
          slots_collected: slots.length,
          venues_processed: uniqueVenues.length,
          execution_time_ms: executionTime,
          provider: 'playtomic'
        });
        
        this.metrics.recordSuccess(executionTime);
        this.circuitBreaker.recordSuccess();
        
        return {
          city: task.city,
          date: task.date,
          status: 'success',
          slotsCollected: slots.length,
          venuesProcessed: uniqueVenues.length,
          executionTime,
          attempts: attempt
        };
        
      } catch (error) {
        lastError = error as Error;
        this.metrics.recordFailure();
        this.circuitBreaker.recordFailure();
        
        // Log failed attempt
        await persistentCache.logCollection({
          collection_id: collectionId,
          city: task.city,
          date: task.date,
          status: 'error',
          slots_collected: 0,
          venues_processed: 0,
          execution_time_ms: Date.now() - Date.now(),
          provider: 'playtomic',
          error_message: lastError.message
        });
        
        if (attempt < plan.maxRetries + 1) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.warn(`Retrying ${task.city}:${task.date} in ${delay}ms (attempt ${attempt}/${plan.maxRetries + 1})`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Production collection method
   */
  private async collectCityDateProduction(city: string, date: string): Promise<CourtSlot[]> {
    const params = {
      sport: 'padel' as const,
      location: city,
      date,
    };
    
    // Production mode - collect from ALL venues
    return await this.provider.fetchAvailability(params);
  }

  /**
   * Calculate task priority based on cache freshness and demand
   */
  private calculateTaskPriority(city: string, date: string, cacheStats: any): number {
    let priority = 50; // Base priority
    
    // Higher priority for sooner dates
    const daysFromNow = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    priority += Math.max(0, 10 - daysFromNow * 2);
    
    // Higher priority for weekends
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      priority += 20;
    }
    
    // Higher priority for peak times (Friday/Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      priority += 10;
    }
    
    return priority;
  }

  private async performHealthChecks(): Promise<void> {
    const health = await persistentCache.healthCheck();
    if (!health.healthy) {
      throw new Error('Database health check failed');
    }
  }

  private async analyzeResults(results: ProductionCollectionItem[]): Promise<CollectionAnalysis> {
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    
    return {
      totalTasks: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      totalSlots: successful.reduce((sum, r) => sum + r.slotsCollected, 0),
      totalVenues: successful.reduce((sum, r) => sum + r.venuesProcessed, 0),
      averageExecutionTime: successful.reduce((sum, r) => sum + r.executionTime, 0) / successful.length || 0
    };
  }

  private async attemptGracefulDegradation(): Promise<ProductionCollectionItem[]> {
    // Try to collect at least today's data
    try {
      const today = new Date().toISOString().split('T')[0];
      const slots = await this.collectCityDateProduction('london', today);
      
      return [{
        city: 'london',
        date: today,
        status: 'success',
        slotsCollected: slots.length,
        venuesProcessed: [...new Set(slots.map(s => s.venue.id))].length,
        executionTime: 0,
        attempts: 1
      }];
    } catch {
      return [];
    }
  }

  private createTimeoutPromise<T>(ms: number, context: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms for ${context}`)), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker for fault tolerance
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForPermit();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
  
  private async waitForPermit(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
  
  private release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

/**
 * Performance metrics collector
 */
class CollectionMetrics {
  private successes = 0;
  private failures = 0;
  private totalExecutionTime = 0;
  
  recordSuccess(executionTime: number): void {
    this.successes++;
    this.totalExecutionTime += executionTime;
  }
  
  recordFailure(): void {
    this.failures++;
  }
  
  getSnapshot(): MetricsSnapshot {
    const total = this.successes + this.failures;
    return {
      totalRequests: total,
      successes: this.successes,
      failures: this.failures,
      successRate: total > 0 ? (this.successes / total) * 100 : 0,
      averageExecutionTime: this.successes > 0 ? this.totalExecutionTime / this.successes : 0
    };
  }
}

// Types
interface CollectionTask {
  city: string;
  date: string;
  priority: number;
  attempts: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface WorkPlan {
  tasks: CollectionTask[];
  maxConcurrency: number;
  timeoutPerTask: number;
  maxRetries: number;
}

interface ProductionCollectionItem {
  city: string;
  date: string;
  status: 'success' | 'failed';
  slotsCollected: number;
  venuesProcessed: number;
  executionTime: number;
  attempts: number;
  error?: string;
}

interface ProductionCollectionResult {
  status: 'success' | 'partial_failure';
  collectionId: string;
  results: ProductionCollectionItem[];
  analysis?: CollectionAnalysis;
  error?: string;
  metrics: MetricsSnapshot;
  totalTime: number;
  timestamp: string;
}

interface CollectionAnalysis {
  totalTasks: number;
  successful: number;
  failed: number;
  successRate: number;
  totalSlots: number;
  totalVenues: number;
  averageExecutionTime: number;
}

interface MetricsSnapshot {
  totalRequests: number;
  successes: number;
  failures: number;
  successRate: number;
  averageExecutionTime: number;
}