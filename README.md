# Hydrolyze

**Goal:** To provide a comprehensive platform for swimmers and coaches to log, view, and analyze swim data, fostering a collaborative environment for performance tracking and improvement.

## User Roles

- **Swimmer:** Can log their swim times, view their performance data, manage their goal times, and connect with coaches.
- **Coach:** Can manage a roster of swimmers, view their swimmers' swim data and goal times, and track their progress.

## Data Collection

The application collects the following data for each swim record:

- Date and Time
- Distance (m)
- Stroke (Freestyle, Backstroke, Breaststroke, Butterfly)
- Time Swum (duration in seconds)
- Target Time (can auto suggest if the user has goal times)
- Gear Used (Fins, Paddles, Pull Buoy, Snorkel, NoGear)
- Pool Length (25m or 50m)
- Average Stroke Rate
- Heart Rate (at the completion of the swim)
- Swimmer Name (coach only)

## Key Features

- **Interactive Dashboard:** Visualize swim performance over time with charts and graphs. The dashboard is tailored to the user's role, with coaches able to see data for all their swimmers.
- **Advanced Filtering:** Filter swim records by a variety of data points, including stroke, distance, gear, and swimmer.
- **Detailed Swim Metrics:** The application automatically calculates advanced metrics for each swim, including:
    - **Velocity:** Speed of the swim (m/s).
    - **Stroke Length (SL):** Distance traveled per stroke.
    - **Swim Index (SI):** A measure of overall efficiency, combining speed and stroke length.
    - **Internal-to-External Load Ratio (IE):** The physiological cost (heart rate) for the mechanical work done (Swim Index).
- **Goal Time Management:** Set, track, and manage goal times for different strokes, distances, and gear combinations.
- **Activity Calendar:** A calendar view to visualize all swim activities, including Strava sessions, races, and pace splits.
- **Strava Integration:** Connect your Strava account to automatically sync your swim sessions.
- **Coach-Swimmer Management:** A complete system for coaches and swimmers to connect. Coaches can invite swimmers, and swimmers can accept or reject invitations. Both can manage their connections.