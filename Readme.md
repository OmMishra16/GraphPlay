# GraphPlay - Interactive Graph Algorithm Learning Platform

Deployed link :- https://graph-play.vercel.app/
Demo Video Link :- https://www.loom.com/share/544480defa4c446dbfb5c6d1f9839814?sid=0925f975-519c-4f74-be70-b12eb1b8e8be

## Project Description
GraphPlay is a web-based educational game platform designed to help students and enthusiasts learn fundamental graph algorithms through interactive mini-games. The platform aims to make complex graph theory concepts accessible and engaging by allowing users to visualize and experiment with algorithms in a fun, hands-on environment.

**Goals:**
*   To provide an intuitive and interactive way to learn graph algorithms.
*   To offer a gamified experience that encourages exploration and understanding of core computer science concepts.
*   To serve as a valuable resource for CS students, those preparing for coding interviews, and anyone curious about graph theory.

**Key Features:**
*   **Interactive Mini-Games:** Each game focuses on a specific graph algorithm, allowing users to see how it works step-by-step.
*   **Visual Learning:** Algorithms are demonstrated visually on a canvas, showing traversal, pathfinding, and graph transformations in real-time.
*   **User-Friendly Interface:** A clean and responsive design built with React.js and Tailwind CSS ensures a smooth learning experience.
*   **Performance Tracking:** Basic statistics like time elapsed, cells explored, and path length are provided for each game.

**Implementation Highlights:**
*   Developed using React.js for the frontend, leveraging React Hooks for state management and component logic.
*   Styled with Tailwind CSS for a modern and responsive user interface.
*   Game rendering is handled using the HTML Canvas API, providing direct control over visual elements and animations.
*   Utilizes `lucide-react` for a consistent and clean icon set across the application.
*   Currently, all game logic and state management are handled client-side, with no backend implementation.

## Graph Concepts Used

The GraphPlay platform implements and demonstrates the following graph concepts, algorithms, and techniques:

*   **Breadth-First Search (BFS):** Used in the "Maze Solver" game to find the shortest path in an unweighted graph.
*   **Depth-First Search (DFS):** Used in the "Maze Solver" game for pathfinding and in the "Cycle Detective" game for cycle detection.
*   **Dijkstra’s Algorithm:** Implemented in the "Path Finder" game to find the shortest path in a weighted graph.
*   **Greedy Graph Coloring:** Demonstrated in the "Graph Coloring" game, where users apply colors to nodes based on a greedy approach to avoid conflicts.
*   **Minimum Spanning Tree (MST):** The core concept behind the "Network Connector" game, aiming to connect all nodes with the least total edge weight.
*   **Kruskal's Algorithm:** Specifically implemented within the "Network Connector" game to find the optimal MST solution.
*   **DFS Cycle Detection:** The primary algorithm used in the "Cycle Detective" game to identify loops in both directed and undirected graphs.
