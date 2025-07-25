#!/bin/bash

# PLAYScanner Lambda Deployment Script
# 
# Prerequisites:
# 1. AWS CLI installed and configured
# 2. IAM role created for Lambda execution
# 3. Environment variables set

set -e

# Configuration
FUNCTION_NAME="playscanner-collector"
REGION="eu-west-2"  # London region
RUNTIME="nodejs20.x"
HANDLER="src/index.handler"
TIMEOUT=300  # 5 minutes
MEMORY=512
ROLE_ARN="${LAMBDA_ROLE_ARN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 PLAYScanner Lambda Deployment Script${NC}"
echo "=========================================="

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if [ -z "$ROLE_ARN" ]; then
    echo -e "${RED}❌ LAMBDA_ROLE_ARN environment variable not set.${NC}"
    echo "Please set it to your Lambda execution role ARN."
    exit 1
fi

# Step 1: Install production dependencies
echo -e "\n${YELLOW}📦 Installing production dependencies...${NC}"
npm ci --production

# Step 2: Create deployment package
echo -e "\n${YELLOW}📦 Creating deployment package...${NC}"
rm -f function.zip
zip -r function.zip . -x "*.git*" -x "test-*" -x "*.md" -x "deploy.sh" -x "*.zip"

# Get file size
SIZE=$(du -h function.zip | cut -f1)
echo -e "${GREEN}✅ Package created: function.zip (${SIZE})${NC}"

# Step 3: Check if function exists
echo -e "\n${YELLOW}🔍 Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    # Update existing function
    echo -e "${YELLOW}📝 Updating existing function...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION \
        --output table
    
    # Wait for update to complete
    echo -e "${YELLOW}⏳ Waiting for update to complete...${NC}"
    aws lambda wait function-updated \
        --function-name $FUNCTION_NAME \
        --region $REGION
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --region $REGION \
        --output table
    
else
    # Create new function
    echo -e "${YELLOW}🆕 Creating new Lambda function...${NC}"
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --zip-file fileb://function.zip \
        --region $REGION \
        --output table
fi

# Step 4: Set environment variables
echo -e "\n${YELLOW}🔐 Setting environment variables...${NC}"
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={
        SUPABASE_URL=${SUPABASE_URL},
        SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY},
        NODE_ENV=production
    }" \
    --region $REGION \
    --output table

# Step 5: Create or update EventBridge rule
echo -e "\n${YELLOW}⏰ Setting up EventBridge schedule...${NC}"
RULE_NAME="${FUNCTION_NAME}-schedule"

# Create rule (runs every 30 minutes)
aws events put-rule \
    --name $RULE_NAME \
    --schedule-expression "rate(30 minutes)" \
    --state ENABLED \
    --description "Trigger PLAYScanner collection every 30 minutes" \
    --region $REGION

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id "${RULE_NAME}-permission" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:*:rule/${RULE_NAME}" \
    --region $REGION 2>/dev/null || true

# Add Lambda as target for the rule
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
aws events put-targets \
    --rule $RULE_NAME \
    --targets "Id"="1","Arn"="$LAMBDA_ARN" \
    --region $REGION

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "=========================================="
echo -e "Function Name: ${GREEN}$FUNCTION_NAME${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Schedule: ${GREEN}Every 30 minutes${NC}"
echo -e "\n${YELLOW}📊 Test your function:${NC}"
echo "aws lambda invoke --function-name $FUNCTION_NAME --region $REGION output.json"
echo -e "\n${YELLOW}📋 View logs:${NC}"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"