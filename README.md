# LightGUI

A modern web interface for managing Lighttpd virtual host configurations.

## Features

- Web-based virtual host management
- Real-time configuration validation
- Support for URL rewriting
- Performance optimization settings
- Compression and caching configuration
- Service restart functionality

## Prerequisites

- Node.js 18 or later
- Lighttpd web server
- Sudo access for service management

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd lightGUI
```

2. Install dependencies:
```bash
npm install
```

3. Configure sudo permissions:
```bash
sudo cp lighttpd-nopasswd /etc/sudoers.d/lighttpd
sudo chmod 440 /etc/sudoers.d/lighttpd
```

4. Start the development server:
```bash
npm run dev
```

## Development

- Built with Next.js and TypeScript
- Uses Tailwind CSS for styling
- Shadcn UI components
- Real-time configuration validation

## License

MIT License
