#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const sharp = require('sharp');

const ASCII_CHARS = ' .:-=+*#%@'; //lighter to darker characters 

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        'info': '\x1b[37m',
        'success': '\x1b[32m\x1b[1m',
        'warning': '\x1b[33m',
        'error': '\x1b[31m\x1b[1m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type] || '\x1b[0m'}[${timestamp}] ${message}${reset}`);
}

class VideoToAscii {
    constructor(videoPath, outputDir = './ascii', fps = 24) {
        this.videoPath = videoPath;
        this.outputDir = outputDir;
        this.tempDir = path.join(outputDir, 'temp_frames');
        this.asciiWidth = 80;
        this.asciiHeight = 24;
        this.fps = fps;
        this.videoInfo = null;
    }

    async init() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async getVideoInfo() {
        log('Getting video information...', 'info');
        
        try {
            const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${this.videoPath}"`;
            const output = execSync(command, { encoding: 'utf8' });
            const info = JSON.parse(output);
            
            const videoStream = info.streams.find(stream => stream.codec_type === 'video');
            if (!videoStream) {
                throw new Error('No video stream found');
            }

            this.videoInfo = {
                duration: parseFloat(info.format.duration),
                width: videoStream.width,
                height: videoStream.height,
                originalFps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
                bitrate: parseInt(info.format.bit_rate),
                format: info.format.format_name,
                size: parseInt(info.format.size)
            };

            log('Video info extracted successfully!', 'success');
        } catch (error) {
            throw new Error(`FFprobe error: ${error.message}`);
        }
    }

    async extractFrames() {
        log('Extracting frames from video...', 'info');
        
        const command = [
            'ffmpeg',
            '-i', this.videoPath,
            '-vf', `fps=${this.fps},scale=${this.asciiWidth}:${this.asciiHeight}`,
            '-f', 'image2',
            '-y',
            path.join(this.tempDir, 'frame_%06d.png')
        ];

        try {
            execSync(command.join(' '), { stdio: 'pipe' });
            log('Frames extracted successfully!', 'success');
        } catch (error) {
            throw new Error(`FFmpeg error: ${error.message}`);
        }
    }

    pixelToAscii(pixelValue) {
        const charIndex = Math.floor((pixelValue / 255) * (ASCII_CHARS.length - 1));
        return ASCII_CHARS[charIndex];
    }

    async imageToAscii(imagePath) {
        try {
            const { data, info } = await sharp(imagePath)
                .greyscale()
                .raw()
                .toBuffer({ resolveWithObject: true });

            let asciiArt = '';
            
            const borderChar = '=';
            const topBorder = '#' + borderChar.repeat(this.asciiWidth) + '#';
            asciiArt += topBorder + '\n';

            for (let y = 0; y < info.height; y++) {
                let line = '|';
                for (let x = 0; x < info.width; x++) {
                    const pixelIndex = y * info.width + x;
                    const pixelValue = data[pixelIndex];
                    line += this.pixelToAscii(pixelValue);
                }
                line += '|';
                asciiArt += line + '\n';
            }

            const bottomBorder = '#' + borderChar.repeat(this.asciiWidth) + '#';
            asciiArt += bottomBorder + '\n';

            return asciiArt;
        } catch (error) {
            throw new Error(`Error processing image ${imagePath}: ${error.message}`);
        }
    }

    async processFrames() {
        log('Converting frames to ASCII...');
        
        const frameFiles = fs.readdirSync(this.tempDir)
            .filter(file => file.endsWith('.png'))
            .sort();

        let frameCount = 0;
        let fullAsciiMovie = '';
        
        for (const frameFile of frameFiles) {
            const framePath = path.join(this.tempDir, frameFile);
            const asciiArt = await this.imageToAscii(framePath);
            
            if (frameCount > 0) {
                fullAsciiMovie += '!$$!\n';
            }
            
            fullAsciiMovie += asciiArt;
            frameCount++;
            
            if (frameCount % 10 === 0) {
                log(`Processed ${frameCount} frames...`);
            }
        }

        // Create metadata JSON
        const metadata = {
            version: "1.0",
            generatedAt: new Date().toISOString(),
            video: {
                sourcePath: path.resolve(this.videoPath),
                originalDuration: this.videoInfo.duration,
                originalWidth: this.videoInfo.width,
                originalHeight: this.videoInfo.height,
                originalFps: this.videoInfo.originalFps,
                format: this.videoInfo.format,
                bitrate: this.videoInfo.bitrate,
                fileSize: this.videoInfo.size
            },
            ascii: {
                fps: this.fps,
                width: this.asciiWidth,
                height: this.asciiHeight,
                totalFrames: frameCount,
                duration: frameCount / this.fps,
                frameDelimiter: "!$$!",
                charset: ASCII_CHARS
            },
            playback: {
                frameDuration: 1000 / this.fps, // milliseconds per frame
                totalDurationMs: (frameCount / this.fps) * 1000
            }
        };

        const outputFileName = 'ascii_movie.txt';
        const outputPath = path.join(this.outputDir, outputFileName);
        
        // Write JSON metadata on first line, followed by ASCII content
        const finalContent = JSON.stringify(metadata) + '\n' + fullAsciiMovie;
        fs.writeFileSync(outputPath, finalContent, 'utf8');

        log(`Conversion complete! ${frameCount} ASCII frames saved to ${outputPath}`, 'success');
        return frameCount;
    }

    cleanup() {
        if (fs.existsSync(this.tempDir)) {
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.tempDir, file));
            });
            fs.rmdirSync(this.tempDir);
        }
    }

    async convert() {
        try {
            await this.init();
            await this.getVideoInfo();
            await this.extractFrames();
            const frameCount = await this.processFrames();
            this.cleanup();
            
            log('\nVideo to ASCII conversion completed successfully!', 'success');
            log(`ASCII movie saved as: ${path.resolve(this.outputDir, 'ascii_movie.txt')}`, 'success');
            log(`Original video: ${this.videoInfo.duration.toFixed(2)}s (${this.videoInfo.originalFps.toFixed(1)} fps)`, 'success');
            log(`ASCII version: ${(frameCount / this.fps).toFixed(2)}s (${this.fps} fps)`, 'success');
            log(`Total frames: ${frameCount}`, 'success');
            log(`Resolution: ${this.asciiWidth}x${this.asciiHeight} characters`, 'success');
        } catch (error) {
            log(`❌ Error: ${error.message}`, 'error');
            this.cleanup();
            process.exit(1);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node vidtoascii.js <video-path> [fps] [output-directory]');
        console.log('');
        console.log('Examples:');
        console.log('  node vidtoascii.js ./my-video.mp4');
        console.log('  node vidtoascii.js ./my-video.mp4 12');
        console.log('  node vidtoascii.js ./my-video.mp4 30 ./my-output');
        console.log('');
        console.log('Parameters:');
        console.log('  video-path        Path to the input video file');
        console.log('  fps              Frames per second (default: 24)');
        console.log('  output-directory Output directory (default: ./ascii)');
        console.log('');
        console.log('Output format:');
        console.log('  The first line contains JSON metadata with video info, fps, duration, etc.');
        console.log('  Following lines contain ASCII frames separated by "!$$!" delimiter');
        console.log('');
        console.log('Requirements:');
        console.log('  - FFmpeg must be installed and available in PATH');
        console.log('  - npm install sharp');
        process.exit(1);
    }

    const videoPath = args[0];
    const fps = args[1] ? parseInt(args[1]) : 24;
    const outputDir = args[2] || './ascii';
    
    if (isNaN(fps) || fps <= 0 || fps > 120) {
        log('❌ Invalid FPS value. Please provide a number between 1 and 120.', 'error');
        process.exit(1);
    }
    
    if (!fs.existsSync(videoPath)) {
        log(`❌ Video file not found: ${videoPath}`, 'error');
        process.exit(1);
    }

    try {
        execSync('ffmpeg -version', { stdio: 'pipe' });
    } catch (error) {
        log('❌ FFmpeg not found. Please install FFmpeg and make sure it\'s in your PATH.', 'error');
        log('   Download from: https://ffmpeg.org/download.html', 'warning');
        process.exit(1);
    }

    try {
        execSync('ffprobe -version', { stdio: 'pipe' });
    } catch (error) {
        log('❌ FFprobe not found. Please install FFmpeg (includes FFprobe) and make sure it\'s in your PATH.', 'error');
        log('   Download from: https://ffmpeg.org/download.html', 'warning');
        process.exit(1);
    }

    log('Starting video to ASCII conversion...', 'info');
    log(`Input: ${videoPath}`, 'info');
    log(`FPS: ${fps}`, 'info');
    log(`Output: ${outputDir}`, 'info');

    const converter = new VideoToAscii(videoPath, outputDir, fps);
    await converter.convert();
}

if (require.main === module) {
    main().catch(error => {
        log(`❌ Unexpected error: ${error}`, 'error');
        process.exit(1);
    });
}