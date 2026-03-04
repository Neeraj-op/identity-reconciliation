# Identity Reconciliation

Backend API for contact identity linking across multiple purchases.

## Live API Endpoint

**POST** `https://identity-reconciliation-api-1dvw.onrender.com/api/identify`

## Example Request
```bash
curl -X POST https://identity-reconciliation-api-1dvw.onrender.com/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentalflame@hillvalley.edu",
    "phoneNumber": "78901245"
  }'
```

## Example Response
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["mentalflame@hillvalley.edu"],
    "phoneNumbers": ["78901245"],
    "secondaryContactIds": []
  }
}
```

## Testing with Postman

**METHOD** `POST`  
**URL** `https://identity-reconciliation-api-1dvw.onrender.com/api/identify`  
**Headers** `Content-Type: application/json`  
**BODY-RAW JSON:** 
```json 
  {
    "email": "mentalflame@hillvalley.edu",
    "phoneNumber": "78901245"
  }
  ```





## Tech Stack

- Node.js + TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Deployed on Render.com
