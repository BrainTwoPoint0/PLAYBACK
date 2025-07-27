# PLAYScanner Lambda Collector

AWS Lambda function for PLAYScanner background data collection. This function runs periodically to collect padel court availability from Playtomic and stores the data in Supabase.

## 🚀 Quick Start

### Prerequisites

1. **AWS Account** with Lambda access
2. **AWS CLI** installed and configured
3. **Supabase Project** with schema deployed
4. **Node.js 18+** for local development

### Environment Variables

Create a `.env` file for local testing:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
```

### Local Testing

```bash
# Install dependencies
npm install

# Test locally
npm test
```

### Deployment

1. **Create IAM Role** for Lambda execution:

   ```bash
   aws iam create-role --role-name playscanner-lambda-role \
     --assume-role-policy-document file://trust-policy.json
   ```

2. **Set environment variables**:

   ```bash
   export LAMBDA_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/playscanner-lambda-role
   export SUPABASE_URL=your-supabase-url
   export SUPABASE_SERVICE_KEY=your-service-key
   ```

3. **Deploy to AWS**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 📋 Architecture

```
EventBridge (every 30 min) → Lambda → Playtomic API
                                ↓
                           Supabase DB
```

## 🔧 Configuration

- **Memory**: 512MB (optimized for cost)
- **Timeout**: 5 minutes
- **Schedule**: Every 30 minutes
- **Region**: eu-west-2 (London)

## 💰 Cost Optimization

Staying within AWS Free Tier:

- 1M Lambda requests/month free
- 400,000 GB-seconds compute free
- EventBridge scheduled rules are free

Expected usage:

- 48 executions/day = 1,440/month
- ~22k GB-seconds/month
- **Total cost**: $0 (within free tier)

## 🧪 Testing

### Manual Invocation

```bash
# Invoke function
aws lambda invoke --function-name playscanner-collector \
  --region eu-west-2 output.json

# Check result
cat output.json | jq
```

### View Logs

```bash
# Stream logs
aws logs tail /aws/lambda/playscanner-collector --follow --region eu-west-2
```

### Health Check

```bash
# Check cache stats
aws lambda invoke --function-name playscanner-collector \
  --payload '{"action":"healthCheck"}' \
  --region eu-west-2 health.json
```

## 📊 Monitoring

1. **CloudWatch Metrics**:

   - Invocations
   - Duration
   - Errors
   - Throttles

2. **Custom Metrics**:

   - Slots collected
   - Venues processed
   - Collection success rate

3. **Alarms**:
   - Error rate > 10%
   - Duration > 4 minutes
   - Consecutive failures

## 🐛 Troubleshooting

### Common Issues

1. **Timeout errors**:

   - Reduce batch size in collector
   - Increase Lambda memory/timeout

2. **Supabase connection**:

   - Check environment variables
   - Verify service key permissions

3. **No data collected**:
   - Check Playtomic API changes
   - Verify venue search parameters

### Debug Mode

Set environment variable for verbose logging:

```bash
DEBUG=true
```

## 🔄 Updates

To update the function:

```bash
# Make code changes
# Then redeploy
./deploy.sh
```

## 🏗️ Project Structure

```
lambda-playscanner/
├── src/
│   ├── index.js           # Lambda handler
│   ├── collector.js       # Collection logic
│   ├── supabase.js        # Database operations
│   └── providers/
│       └── playtomic.js   # Playtomic scraper
├── package.json
├── deploy.sh              # Deployment script
├── test-local.js          # Local testing
└── README.md
```

## 📈 Performance

- Average execution time: 20-30 seconds
- Memory usage: ~200MB
- Success rate: >95%
- Data freshness: <30 minutes
