#!/bin/bash

# OpenActive Football Lambda Deployment Script
# Uses AWS_PROFILE=playscanner

set -e

FUNCTION_NAME="openactive-football-collector"
REGION="eu-west-2"
RUNTIME="nodejs20.x"
HANDLER="src/index.handler"
TIMEOUT=300
MEMORY=256
ROLE_ARN="${LAMBDA_ROLE_ARN}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

export AWS_PROFILE=playscanner

echo -e "${GREEN}🏟️ OpenActive Football Lambda Deployment${NC}"
echo "=========================================="

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found.${NC}"
    exit 1
fi

# Step 1: Install production dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production

# Step 2: Create deployment package
echo -e "\n${YELLOW}📦 Creating package...${NC}"
rm -f function.zip
zip -r function.zip . -x "*.git*" -x "test-*" -x "*.md" -x "deploy.sh" -x "*.zip" -x ".env"

SIZE=$(du -h function.zip | cut -f1)
echo -e "${GREEN}✅ Package: function.zip (${SIZE})${NC}"

# Step 3: Check if function exists
echo -e "\n${YELLOW}🔍 Checking if function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo -e "${YELLOW}📝 Updating existing function...${NC}"

    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION \
        --output table

    echo -e "${YELLOW}⏳ Waiting for update...${NC}"
    aws lambda wait function-updated \
        --function-name $FUNCTION_NAME \
        --region $REGION

    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --region $REGION \
        --output table
else
    if [ -z "$ROLE_ARN" ]; then
        echo -e "${RED}❌ LAMBDA_ROLE_ARN not set. Required for first deploy.${NC}"
        exit 1
    fi

    echo -e "${YELLOW}🆕 Creating new function...${NC}"
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --zip-file fileb://function.zip \
        --region $REGION \
        --environment "Variables={SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY},NODE_ENV=production}" \
        --output table
fi

# Step 4: Set up hourly schedule (at :15 to avoid overlap with padel Lambda at :00/:30)
echo -e "\n${YELLOW}⏰ Setting up hourly schedule...${NC}"
RULE_NAME="${FUNCTION_NAME}-schedule"

aws events put-rule \
    --name $RULE_NAME \
    --schedule-expression "cron(15 * * * ? *)" \
    --state ENABLED \
    --description "Trigger OpenActive football collection hourly at :15" \
    --region $REGION

aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id "${RULE_NAME}-permission" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:*:rule/${RULE_NAME}" \
    --region $REGION 2>/dev/null || true

LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
aws events put-targets \
    --rule $RULE_NAME \
    --targets "Id"="1","Arn"="$LAMBDA_ARN" \
    --region $REGION

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "Function: $FUNCTION_NAME"
echo "Schedule: Hourly at :15"
echo "Profile: playscanner"
