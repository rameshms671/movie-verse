import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("MovieMetrics")

# ✅ Helper: convert Decimals safely for JSON
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    try:
        # ✅ Parse incoming request body
        if event.get("body"):
            body = json.loads(event["body"])
        else:
            body = event  # fallback if called directly (for testing)

        search_string = body.get("SearchString")
        movie_id = body.get("MovieId")
        poster_url = body.get("PosterUrl")

        if not search_string:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing SearchString"})
            }

        # ✅ Try to increment Count atomically (create if missing)
        response = table.update_item(
            Key={"SearchTerm": search_string},
            UpdateExpression="SET #c = if_not_exists(#c, :start) + :inc, "
                             "#m = if_not_exists(#m, :movie), "
                             "#p = if_not_exists(#p, :poster)",
            ExpressionAttributeNames={
                "#c": "Count",
                "#m": "MovieId",
                "#p": "PosterUrl"
            },
            ExpressionAttributeValues={
                ":start": Decimal(0),
                ":inc": Decimal(1),
                ":movie": movie_id or "unknown",
                ":poster": poster_url or "unknown"
            },
            ReturnValues="ALL_NEW"
        )

        updated_item = response["Attributes"]

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(
                {
                    "message": f"Updated {search_string}",
                    "item": updated_item
                },
                cls=DecimalEncoder
            )
        }

    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }
