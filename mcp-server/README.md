# Campus Helpdesk MCP Server

A Model Context Protocol (MCP) server built with the official TypeScript/Node SDK (`@modelcontextprotocol/sdk`) communicating over standard input/output (`stdio`).

## Capabilities Exposed
1. **Tool `get_timetable(batch, day)`**: Fetches university course schedules for a designated batch (`CS-A`, `CS-B`, `EE-A`) and weekday from mock timetable records.
2. **Tool `get_fee_status(student_id)`**: Looks up student tuition balance and clearance status using synthetic student IDs (`STU001`, `STU002`, `STU003`).
3. **Resource `campus://policies/hostel-rules`**: Exposes official hostel conduct policies, curfew hours, visitor rules, and emergency medical contacts as Markdown.

---

## Installation & Setup

### Prerequisites
- Node.js v18+ (tested on Node v26.9.0)
- npm v9+

### Install Dependencies
From the repository root:
```bash
cd campus-helpdesk-agent/mcp-server
npm install
```

---

## Running the Server

### 1. Direct Stdio Execution
The server executes over `stdio` and waits for JSON-RPC 2.0 messages:
```bash
node index.js
```
*Note: Diagnostic messages are emitted to `stderr`, preserving `stdout` exclusively for JSON-RPC 2.0 frames.*

---

## Testing with the MCP Inspector

The official MCP Inspector provides an interactive developer UI to inspect tools, test invocations, and review schemas:

### Interactive Web UI Mode:
```bash
npx @modelcontextprotocol/inspector node index.js
```
This launches a local web server (typically at `http://localhost:5173` or `http://localhost:6274`) where you can:
- View connected server info: `campus-helpdesk-mcp (v1.0.0)`
- Inspect and test `get_timetable` and `get_fee_status` tools
- Read the `campus://policies/hostel-rules` resource

### Non-Interactive CLI Mode:
```bash
npx @modelcontextprotocol/inspector --cli node index.js --method tools/list
```
