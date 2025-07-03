# AI Development Assistant Instructions

## Core Principles
- **Efficiency First**: Always use modern, efficient patterns. Prioritize code reusability and maintainability.
- **User-Focused**: Build exactly what the user requests - no more, no less. Avoid scope creep.
- **Real-time Updates**: All data displays should update in real-time when possible. Use proper state management.

## Project Architecture Guidelines

### File Organization
- Keep components small and focused (under 200 lines when possible)
- Create separate hooks for complex state management
- Use proper TypeScript interfaces for all data structures
- Organize files logically: components, hooks, pages, services, types

### State Management
- Use React hooks for local state
- Implement proper localStorage persistence for project data
- Ensure state updates trigger UI re-renders appropriately
- Use proper dependency arrays in useEffect hooks

### UI/UX Standards
- Follow modern IDE color schemes for code-related interfaces
- Use semantic design tokens from the CSS variables system
- Implement proper loading states and error handling
- Ensure all dropdowns have proper backgrounds and z-index
- Make interfaces responsive and accessible

## Development Environment Features

### Project Management
- Projects should persist across browser sessions
- Support creating, selecting, and managing multiple projects
- Provide easy project switching with + button for quick creation
- Auto-save project changes to localStorage

### File System
- Real-time file creation, editing, and deletion
- Proper file tree navigation with expand/collapse
- Live preview updates for HTML/web files
- Code editor with syntax highlighting and proper theming

### Chat Interface
- Persistent chat history per project
- Support for AI tool calls that modify project files
- Real-time feedback on file operations
- Clear error handling and user notifications

## Code Quality Standards

### TypeScript
- Use strict typing for all interfaces and functions
- Proper error handling with try/catch blocks
- Meaningful variable and function names
- Document complex logic with comments

### React Best Practices
- Use functional components with hooks
- Implement proper cleanup in useEffect
- Optimize re-renders with useMemo/useCallback when needed
- Handle edge cases gracefully

### Styling
- Use Tailwind CSS with semantic tokens
- Follow the design system defined in index.css
- Create reusable component variants
- Ensure dark/light mode compatibility

## Data Flow Patterns

### Project Operations
1. User initiates action (create file, edit content, etc.)
2. Update local state immediately for responsive UI
3. Persist changes to localStorage
4. Trigger dependent component re-renders
5. Provide user feedback (toasts, status updates)

### AI Integration
- Parse AI responses for tool calls
- Execute file operations from AI instructions
- Update project state with AI-generated content
- Handle errors gracefully with user feedback

## Performance Considerations
- Debounce frequent operations (auto-save, search)
- Use React.memo for expensive components
- Implement proper key props for dynamic lists
- Avoid unnecessary re-renders through proper state design

## Error Handling
- Always catch and handle async operation errors
- Provide meaningful error messages to users
- Log errors to console for debugging
- Graceful degradation when features fail

## Testing & Debugging
- Use browser console for development debugging
- Implement proper logging for state changes
- Test all CRUD operations thoroughly
- Verify localStorage persistence works correctly