# AI Development Assistant

A local AI development assistant inspired by Lovable.dev that works with your locally installed LLM.

## Features

- 💬 **Chat Interface**: Interactive chat with your local LLM
- 📁 **File Explorer**: Browse and manage project files
- 🔧 **Code Editor**: Write and edit code with syntax highlighting
- 🖥️ **Terminal**: Execute commands and interact with your system
- 📊 **Model Status**: Monitor your local LLM performance and health
- ⚙️ **Settings**: Configure your LLM connection and preferences

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn or bun
- A local LLM running (e.g., Ollama, LocalAI, etc.)

## Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## Setting up your Local LLM

### Option 1: Ollama (Recommended)
1. Install [Ollama](https://ollama.com/)
2. Download a model: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. In the app, go to Settings and set endpoint to `http://localhost:11434`

### Option 2: Other Local LLMs
1. Start your local LLM server
2. Note the endpoint URL and port
3. Configure in the app's Settings page

## Configuration

1. **Navigate to Settings** in the app
2. **Configure LLM Settings**:
   - API Endpoint: Your local LLM URL (e.g., `http://localhost:11434`)
   - Model Name: The model you want to use (e.g., `llama2`, `codellama`)
   - Temperature: Control randomness (0.0-1.0)
   - Max Tokens: Maximum response length
3. **Test Connection** to verify everything works

## Usage

- **Chat**: Use the main chat interface to interact with your AI assistant
- **Files**: Browse and manage your project files
- **Editor**: Write and edit code with AI assistance
- **Terminal**: Execute commands and scripts
- **Model**: Monitor your LLM's performance and system resources

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Shadcn/ui
- **Routing**: React Router
- **State**: React Query
- **Icons**: Lucide React

## Development

To modify or extend the application:

1. **Components** are in `src/components/`
2. **Pages** are in `src/pages/`
3. **Styles** use the design system defined in `src/index.css`
4. **UI Components** are from Shadcn/ui in `src/components/ui/`

## Troubleshooting

### LLM Connection Issues
- Ensure your local LLM is running
- Check the endpoint URL and port
- Verify firewall settings aren't blocking the connection

### Performance Issues
- Monitor system resources in the Model page
- Adjust temperature and token limits in Settings
- Consider using a smaller model if experiencing slowdowns

## Contributing

This is a personal development tool. Feel free to customize it for your needs.

## License

MIT License - feel free to use and modify as needed.
