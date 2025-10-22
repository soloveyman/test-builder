# HoReCa Test Builder Service

A specialized HTTP service for generating exam questions for HoReCa (Hotel, Restaurant, Cafe) staff using DeepSeek AI. Ready for deployment on Vercel and integration with Next.js applications.

## 🚀 Features

- **Multiple Question Types**: MCQ (single/multi), True/False, Complete, Cloze, Match, Order
- **Multilingual Support**: Russian and English
- **Difficulty Levels**: Easy, Medium, Hard
- **Security**: HMAC-SHA256 signature verification
- **Quality Control**: Grounding score validation and heuristic checks
- **HoReCa Specialized**: Optimized prompts for hospitality industry

## 📋 Question Types

| Type | Description | Example |
|------|-------------|---------|
| `mcq` / `mcq_single` | Single choice multiple choice | Choose one correct answer |
| `mcq_multi` | Multiple choice (2-3 correct) | Choose all correct answers |
| `tf` | True/False | Statement is true or false |
| `complete` | Fill in the blank | Complete the sentence with "__" |
| `cloze` | Multiple blanks with choices | Fill blanks A, B, C with provided options |
| `match` | Matching pairs | Match left items with right options |
| `order` | Sequence ordering | Arrange items in correct order |
| `mixed` | Random type selection | Random question type |

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd test-builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# HMAC Security
HMAC_KEY_ID=your_key_id
HMAC_SECRET=your_hmac_secret_here

# Performance Settings
MAX_CONTEXT_CHARS=50000
RESPONSE_TIMEOUT_MS=8000
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Type checking
npm run lint

# Build (Vercel handles this automatically)
npm run build
```

## 📡 API Endpoints

### POST `/api/generate`

Generate test questions synchronously.

**Headers:**
- `Content-Type: application/json`
- `x-key-id: your_key_id`
- `x-signature: hmac_sha256_signature`

**Request Body:**
```json
{
  "params": {
    "count": 1,
    "type": "mcq",
    "difficulty": "easy",
    "locale": "ru"
  },
  "context": {
    "text": "Restaurant service context...",
    "facts": ["Fact 1", "Fact 2"],
    "steps": ["Step 1", "Step 2"],
    "definitions": ["Term 1", "Term 2"]
  },
  "sourceRefs": ["source1", "source2"]
}
```

**Response:**
```json
{
  "ok": true,
  "provider": "deepseek",
  "durationMs": 1500,
  "questions": [
    {
      "type": "mcq",
      "id": "q_123",
      "prompt": "What is the correct way to serve wine?",
      "choices": ["Option A", "Option B", "Option C"],
      "answer": 1,
      "explanation": "Explanation...",
      "difficulty": "easy",
      "tags": ["service", "wine"],
      "quality": 0.85
    }
  ],
  "warnings": []
}
```

### POST `/api/generate-async`

Generate test questions asynchronously (MVP placeholder).

### GET `/api/jobs/[id]`

Check job status for async generation.

## 🔐 Security

The service uses HMAC-SHA256 for request authentication:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(requestBody))
  .digest('hex');
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub:**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/test-builder.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `DEEPSEEK_API_KEY`
   - `HMAC_KEY_ID`
   - `HMAC_SECRET`
   - `MAX_CONTEXT_CHARS=50000`
   - `RESPONSE_TIMEOUT_MS=8000`

### Integration with Next.js

```javascript
// In your Next.js app
const response = await fetch('https://your-vercel-app.vercel.app/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-key-id': process.env.HMAC_KEY_ID,
    'x-signature': generateHmacSignature(requestBody, process.env.HMAC_SECRET)
  },
  body: JSON.stringify(requestData)
});
```

## 📊 Quality Control

The service includes several quality checks:

- **Grounding Score**: Ensures questions are based on provided context
- **Choice Validation**: Checks for duplicate or poorly formatted choices
- **Answer Validation**: Verifies answer indices are within range
- **Heuristic Checks**: Validates question structure and content

## 🧪 Testing

```bash
# Test with sample data
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "x-key-id: test" \
  -H "x-signature: your_signature" \
  -d '{
    "params": {
      "count": 1,
      "type": "mcq",
      "difficulty": "easy",
      "locale": "ru"
    },
    "context": {
      "text": "Restaurant service context..."
    }
  }'
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub.