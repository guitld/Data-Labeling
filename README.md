# Image Labeling System

AI-powered image management and labeling system for automatic categorization.

## 🚀 Features

- **Image Upload**: Upload images and organize them into groups
- **AI Tagging**: Automatic tag generation using OpenAI GPT-4o
- **Group Management**: Create and manage image groups
- **Approval Workflow**: Approve or reject tag suggestions
- **Upvote System**: Users can vote on the best tags
- **Dashboard**: Real-time analytics for administrators
- **AI Chat**: Intelligent assistant for data insights

## 🛠️ Technologies

- **Frontend**: React + TypeScript
- **Backend**: Rust + Actix-Web
- **AI**: OpenAI GPT-4 Vision

## 📦 Installation

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd pax-gpt

# Configure OpenAI API key (optional)
export OPENAI_API_KEY="your_api_key_here"

# Run with Docker
docker compose up --build
```

### Local Development
```bash
# Backend
cargo run

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

## 🌐 Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8082

## 👥 Default Mock Users

- **Admin**: `admin` / `admin123`
- **User**: `bob` / `bob123`

## 📋 How to Use

1. **Login**: Sign in with one of the default users
2. **Upload**: Go to "Upload" and add images
3. **Groups**: Organize images into groups in the "Groups" tab
4. **Tags**: Review tag suggestions in the "Tag Review" tab
5. **AI**: Use the chat in the "AI Insights" tab for insights
6. **Dashboard**: View statistics in the "Dashboard" tab

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API key for AI functionality
- `SERVER_HOST`: Server host (default: 0.0.0.0)
- `SERVER_PORT`: Server port (default: 8082)

### Data Structure
Data is stored in `data.json` and includes:
- Users and groups
- Images and metadata
- Tag suggestions and approvals
- Upvote system