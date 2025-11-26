import boto3
import os
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MovieMetrics')

# ✅ Custom encoder to convert Decimal to int/float
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert to int if whole number, else float
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    # Scan the entire table
    response = table.scan()
    items = response.get('Items', [])

    # Keep scanning if there are more pages
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))

    # Sort by 'count' descending
    sorted_items = sorted(items, key=lambda x: int(x['Count']), reverse=True)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"  # optional: for CORS
        },
        "body": json.dumps(sorted_items, cls=DecimalEncoder)  # ✅ must be string
    }
