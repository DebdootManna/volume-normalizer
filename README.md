# Volume Normalizer Chrome Extension

A Chrome extension that automatically normalizes audio volume across browser tabs for a consistent listening experience. Similar to Spotify's volume normalization feature, it ensures audio maintains a balanced loudness without sudden peaks or drops.

![Volume Normalizer Screenshot](https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=800)

## Features

- 🎚️ Real-time audio volume normalization
- 🎯 Automatic detection of audio and video elements
- 🔄 Dynamic processing of multiple media elements
- 🌐 Works across all browser tabs
- 🎛️ Per-tab and global controls
- 💾 Persistent settings across sessions
- ⚡ Low latency audio processing
- 🔋 Efficient resource management

## Technical Details

The extension uses the Web Audio API's `DynamicsCompressorNode` with carefully tuned settings:

- Threshold: -24 dB
- Knee: 30 dB
- Ratio: 12:1
- Attack: 0.003 seconds
- Release: 0.25 seconds

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/volume-normalizer.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the Volume Normalizer icon in your Chrome toolbar
2. Use the global toggle to enable/disable the extension for all tabs
3. Use the per-tab toggle to control normalization for individual tabs
4. Monitor active media elements in the current tab

## How It Works

The extension:
1. Monitors tabs for audio/video elements
2. Creates an audio processing chain using Web Audio API
3. Applies dynamic compression to normalize volume
4. Automatically handles new media elements
5. Preserves settings across browser sessions

## Development

Requirements:
- Chrome Browser
- Node.js 16+

Setup:
```bash
npm install
```

Build:
```bash
npm run build
```

## Project Structure

```
volume-normalizer/
├── manifest.json        # Extension manifest
├── background.js       # Background service worker
├── contentScript.js    # Content script for audio processing
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality
├── popup.css         # Popup styles
└── src/
    ├── audioNormalizer.js  # Core audio processing
    ├── storage.js         # Settings management
    └── utils.js          # Helper functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this code in your own projects.

## Credits

Created with ❤️ by [Your Name]

---

**Note**: This extension respects your privacy and does not collect any user data.