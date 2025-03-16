#!/usr/bin/env python3

import time
import json
import os
from picamera2 import Picamera2
import cv2
import numpy as np
from git import Repo
import colorsys

# Configuration
REPO_PATH = "/home/dave/Code/BerlinerGrau"
DATA_DIR = os.path.join(REPO_PATH, "public/data")
os.makedirs(DATA_DIR, exist_ok=True)


def log(emoji, message):
    """Simple emoji logger"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"{timestamp} {emoji} {message}")


def get_color_name(rgb):
    """Get approximate color name"""
    r, g, b = rgb

    # Simple color classification
    colors = {
        "red": (255, 0, 0),
        "orange": (255, 165, 0),
        "yellow": (255, 255, 0),
        "green": (0, 255, 0),
        "blue": (0, 0, 255),
        "purple": (128, 0, 128),
        "pink": (255, 192, 203),
        "brown": (165, 42, 42),
        "black": (0, 0, 0),
        "white": (255, 255, 255),
        "gray": (128, 128, 128),
    }

    # Find closest color by Euclidean distance
    min_dist = float("inf")
    closest = "unknown"

    for name, color in colors.items():
        dist = sum((c1 - c2) ** 2 for c1, c2 in zip(rgb, color))
        if dist < min_dist:
            min_dist = dist
            closest = name

    return closest


def get_mood(h, s, v):
    """Get mood based on HSV values"""
    # Hue-based mood map
    if s < 0.15:
        return "neutral"
    elif v < 0.3:
        return "mysterious"
    elif h < 0.05 or h > 0.95:  # Red
        return "passionate"
    elif h < 0.12:  # Orange
        return "warm"
    elif h < 0.2:  # Yellow
        return "cheerful"
    elif h < 0.45:  # Green
        return "peaceful"
    elif h < 0.7:  # Blue
        return "calm"
    elif h < 0.8:  # Purple
        return "creative"
    else:  # Pink/Magenta
        return "romantic"


def calculate_greyness(rgb_values):
    """Calculate greyness metrics based on RGB values"""
    # Convert to numpy array for easier calculations
    colors = np.array(rgb_values)

    # Calculate the standard deviation of RGB channels for each pixel
    # Lower standard deviation = more grey (R, G, B values are similar)
    rgb_std = np.std(colors, axis=1)

    # Calculate the average greyness (0-100 scale)
    # 0 = perfect grey, 100 = maximum color
    avg_greyness_level = 100 - (np.mean(rgb_std) / 255 * 100)

    # Calculate the percentage of pixels that are grey
    # A pixel is considered grey if its RGB std deviation is below threshold
    grey_threshold = 15  # Adjust as needed
    grey_pixels = np.sum(rgb_std < grey_threshold)
    grey_percentage = (grey_pixels / len(rgb_std)) * 100

    # Calculate the "Berlin grey" index (0-100)
    # This combines both measures for an overall greyness score
    berlin_grey_index = (avg_greyness_level + grey_percentage) / 2

    # Qualitative greyness description
    if berlin_grey_index < 20:
        description = "very colorful"
    elif berlin_grey_index < 40:
        description = "colorful"
    elif berlin_grey_index < 60:
        description = "moderately grey"
    elif berlin_grey_index < 80:
        description = "quite grey"
    else:
        description = "classic Berlin grey"

    return {
        "avg_greyness_level": round(avg_greyness_level, 1),
        "grey_percentage": round(grey_percentage, 1),
        "berlin_grey_index": round(berlin_grey_index, 1),
        "description": description,
    }


def main():
    log("🚀", "Starting Berlin Colors Monitor")

    # Initialize camera
    camera = Picamera2()
    camera.configure(camera.create_still_configuration(main={"size": (640, 480)}))
    log("📷", "Camera initialized")

    while True:
        try:
            # Capture image
            log("📸", "Taking photo")
            camera.start()
            time.sleep(2)
            image = camera.capture_array()
            camera.stop()

            # Process to 16x16 grid and get colors
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            grid = cv2.resize(rgb, (16, 16)).astype(int).tolist()
            flat_colors = np.array(grid).reshape(-1, 3)

            # Basic color stats
            avg_rgb = np.mean(flat_colors, axis=0).astype(int).tolist()
            hex_color = "#{:02x}{:02x}{:02x}".format(*avg_rgb)
            dominant_color_name = get_color_name(avg_rgb)

            # Brightness (0-100%)
            brightness = round(
                np.mean(np.dot(flat_colors, [0.299, 0.587, 0.114])) / 255 * 100, 1
            )

            # Color variety (standard deviation)
            color_variety = round(np.mean(np.std(flat_colors, axis=0)), 1)

            # Calculate HSV for mood
            r, g, b = [c / 255 for c in avg_rgb]
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            mood = get_mood(h, s, v)

            # Calculate greyness stats
            greyness = calculate_greyness(flat_colors)

            # Color distribution (% of dominant colors)
            color_counts = {}
            for pixel in flat_colors:
                name = get_color_name(pixel)
                color_counts[name] = color_counts.get(name, 0) + 1

            total_pixels = len(flat_colors)
            color_distribution = {
                color: round(count / total_pixels * 100, 1)
                for color, count in color_counts.items()
            }

            # Get temperature feel (warm vs cool)
            warm_colors = sum(
                color_distribution.get(c, 0)
                for c in ["red", "orange", "yellow", "pink"]
            )
            cool_colors = sum(
                color_distribution.get(c, 0) for c in ["blue", "green", "purple"]
            )
            temperature = "warm" if warm_colors > cool_colors else "cool"

            # Get most prominent time of day feel
            if brightness < 30:
                time_of_day = "night"
            elif brightness < 50:
                time_of_day = "evening/dawn"
            elif brightness < 70:
                time_of_day = "day (cloudy)"
            else:
                time_of_day = "day (sunny)"

            log("🎨", f"Average color: {hex_color} ({dominant_color_name})")
            log("✨", f"Mood: {mood}, Temperature: {temperature}, Time: {time_of_day}")
            log(
                "⚪",
                f"Greyness: {greyness['berlin_grey_index']}% - {greyness['description']}",
            )

            # Save data
            timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
            data = {
                "timestamp": timestamp,
                "grid": grid,
                "stats": {
                    "average_rgb": avg_rgb,
                    "hex_color": hex_color,
                    "dominant_color": dominant_color_name,
                    "brightness_percent": brightness,
                    "color_variety": color_variety,
                    "hsv": [round(h * 360), round(s * 100), round(v * 100)],
                    "mood": mood,
                    "greyness": greyness,
                    "color_distribution": color_distribution,
                    "temperature_feel": temperature,
                    "time_of_day_feel": time_of_day,
                },
            }

            # Save current data (overwrite)
            current_path = os.path.join(DATA_DIR, "current.json")
            with open(current_path, "w") as f:
                json.dump(data, f)
            log("💾", f"Data saved to {current_path}")

            # Update history (append)
            history_path = os.path.join(DATA_DIR, "history.json")
            # Load existing history or create new one
            try:
                if os.path.exists(history_path):
                    with open(history_path, "r") as f:
                        history = json.load(f)
                else:
                    history = []
            except Exception as e:
                log("⚠️", f"Error reading history file: {e}")
                history = []

            # Append new entry and save
            history.append(data)
            with open(history_path, "w") as f:
                json.dump(history, f)
            log("📊", f"History updated with {len(history)} entries")

            # Git update
            repo = Repo(REPO_PATH)
            repo.git.add(DATA_DIR)
            repo.git.commit("-m", f"🎞️ {timestamp}")
            repo.git.push()
            log("🔄", "Changes pushed to GitHub")

            # Calculate time until next hour
            next_hour = 3600 - (int(time.time()) % 3600)
            log("⏰", f"Next capture in {next_hour} seconds")
            time.sleep(next_hour)

        except Exception as e:
            log("❌", f"Error: {e}")
            log("🔄", "Retrying in 60 seconds")
            time.sleep(60)


if __name__ == "__main__":
    main()
