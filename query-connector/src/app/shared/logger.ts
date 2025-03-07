import { createLogger, transports, format } from "winston";

// const logger = createLogger({
//   transports: [new transports.Console()],
//   format: format.combine(
//     format.colorize(),
//     format.timestamp(),
//     format.printf(({ timestamp, level, message }) => {
//       return `[${timestamp}] ${level}: ${message}`;
//     })
//   ),
// });


const logger = createLogger({
  transports: [
    new transports.File({
      dirname: "logs",
      filename: "winston_example.log",
    }),
  ],
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, service }) => {
      return `[${timestamp}] ${service} ${level}: ${message}`;
    })
  ),
  defaultMeta: {
    service: "WinstonExample",
  },
});
logger.info("trial")

// Below are a few different examples of how to configure the logger and transports


// const FileTransport = new DailyRotateFile({
//     filename: `logs/%DATE%.log`,
//     maxFiles: 5, // Retain logs for 5 days
//     format: Winston.format.combine(
//         Winston.format.timestamp(),
//         Winston.format.align(),
//         Winston.format.printf((info) => {
//             const { timestamp, level, message, ...args } = info;
//             const ts = timestamp.slice(0, 19).replace('T', ' ');
//             return `${ts} ${level}:${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
//         })
//     ),
// });

// const logger = createLogger({
//   transports: [new transports.Http()],
//   format: format.combine(
//     format.timestamp(),
//     format.printf(({ timestamp, level, message, service }) => {
//       return `[${timestamp}] ${service} ${level}: ${message}`;
//     })
//   ),
//   defaultMeta: {
//     service: "WinstonExample",
//   },
// });
