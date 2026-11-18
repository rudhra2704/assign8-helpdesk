import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize MCP Server with explicit name and version
const server = new McpServer({
  name: "campus-helpdesk-mcp",
  version: "1.0.0",
});

// Mock timetable dataset
const MOCK_TIMETABLE = [
  { batch: "CS-A", day: "Monday", start_time: "09:00", end_time: "10:00", subject: "Data Structures", room: "LH-101", faculty: "Dr. A. Sharma" },
  { batch: "CS-A", day: "Monday", start_time: "10:00", end_time: "11:00", subject: "Computer Networks", room: "LH-101", faculty: "Prof. R. Iyer" },
  { batch: "CS-A", day: "Tuesday", start_time: "09:00", end_time: "10:00", subject: "Algorithms", room: "LH-102", faculty: "Dr. A. Sharma" },
  { batch: "CS-A", day: "Tuesday", start_time: "10:00", end_time: "11:00", subject: "Database Systems", room: "LH-102", faculty: "Prof. M. Rao" },
  { batch: "CS-B", day: "Monday", start_time: "09:00", end_time: "10:00", subject: "Computer Networks", room: "LH-104", faculty: "Prof. R. Iyer" },
  { batch: "CS-B", day: "Tuesday", start_time: "11:00", end_time: "12:00", subject: "Database Systems", room: "LH-104", faculty: "Prof. M. Rao" },
  { batch: "EE-A", day: "Monday", start_time: "09:00", end_time: "10:00", subject: "Circuit Theory", room: "EE-201", faculty: "Dr. N. Joshi" },
  { batch: "EE-A", day: "Thursday", start_time: "09:00", end_time: "10:00", subject: "Control Systems", room: "EE-201", faculty: "Prof. T. Sen" }
];

// Mock fee status dataset (Zero real student data - completely synthetic IDs)
const MOCK_FEE_DATABASE = {
  "STU001": { student_id: "STU001", name: "Student Alpha", program: "B.Tech CSE", tuition_total: 120000, tuition_paid: 120000, balance_due: 0, status: "CLEAR", dueDate: null },
  "STU002": { student_id: "STU002", name: "Student Beta", program: "B.Tech CSE", tuition_total: 120000, tuition_paid: 80000, balance_due: 40000, status: "PENDING", dueDate: "2026-12-15" },
  "STU003": { student_id: "STU003", name: "Student Gamma", program: "B.Tech EE", tuition_total: 110000, tuition_paid: 0, balance_due: 110000, status: "OVERDUE", dueDate: "2026-10-31" }
};

// -------------------------------------------------------------
// Tool 1: get_timetable
// -------------------------------------------------------------
server.tool(
  "get_timetable",
  "Fetch university class schedules for a specified student batch and weekday from official timetable data.",
  {
    batch: z.string().describe("Academic batch identifier (e.g., CS-A, CS-B, EE-A)"),
    day: z.string().describe("Day of the week (e.g., Monday, Tuesday, Wednesday, Thursday, Friday)")
  },
  async ({ batch, day }) => {
    const normBatch = batch.trim().toUpperCase();
    const normDay = day.trim().charAt(0).toUpperCase() + day.trim().slice(1).toLowerCase();

    const allowedBatches = ["CS-A", "CS-B", "EE-A"];
    if (!allowedBatches.includes(normBatch)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Validation Error: Unknown or unlisted batch '${batch}'. Valid mock batches are: ${allowedBatches.join(", ")}.`
          }
        ]
      };
    }

    const matches = MOCK_TIMETABLE.filter(
      item => item.batch.toUpperCase() === normBatch && item.day.toLowerCase() === normDay.toLowerCase()
    );

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No class found in the timetable for that batch/day`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(matches, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// Tool 2: get_fee_status
// -------------------------------------------------------------
server.tool(
  "get_fee_status",
  "Lookup student fee account balance, payments made, and payment clearance status by student ID.",
  {
    student_id: z.string().regex(/^STU\d{3}$/, "Student ID must match format STU### (e.g., STU001, STU002)")
      .describe("Synthetic student identification code in format STU### (e.g., STU001)")
  },
  async ({ student_id }) => {
    const id = student_id.trim().toUpperCase();
    const record = MOCK_FEE_DATABASE[id];

    if (!record) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Account Error: Student ID '${student_id}' was not found in the student accounts database. Ensure ID follows format STU###.`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(record, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// Resource: hostel_rules
// -------------------------------------------------------------
server.resource(
  "hostel_rules",
  "campus://policies/hostel-rules",
  {
    description: "Official Campus Hostel Rules, Curfew Regulations, Visitor Policy, and Medical Contacts",
    mimeType: "text/markdown"
  },
  async (uri) => {
    const filePath = path.join(__dirname, "hostel_rules.md");
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      contents: [
        {
          uri: uri.href,
          text: content,
          mimeType: "text/markdown"
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// Transport Startup
// -------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Campus Helpdesk MCP Server running on stdio transport.");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
