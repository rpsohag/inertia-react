import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "xterm/css/xterm.css";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Circle,
    Loader2,
    Terminal as TerminalIcon,
    XCircle,
} from "lucide-react";
import axios from "axios";
import echo from "@/echo";

interface TerminalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: {
        id: number;
        name: string;
        ip_address: string;
        port: string;
        username: string;
    } | null;
}

export function TerminalModal({
    open,
    onOpenChange,
    server,
}: TerminalModalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sessionId = useRef<string | null>(null);
    const hasInitialized = useRef(false);
    const inputBuffer = useRef<string>("");

    const initializeTerminal = (element: HTMLDivElement | null) => {
        if (!element || !open || !server || hasInitialized.current) {
            return;
        }

        hasInitialized.current = true;

        terminal.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            rows: 30,
            cols: 100,
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                cursor: "#d4d4d4",
                black: "#000000",
                red: "#cd3131",
                green: "#0dbc79",
                yellow: "#e5e510",
                blue: "#2472c8",
                magenta: "#bc3fbc",
                cyan: "#11a8cd",
                white: "#e5e5e5",
                brightBlack: "#666666",
                brightRed: "#f14c4c",
                brightGreen: "#23d18b",
                brightYellow: "#f5f543",
                brightBlue: "#3b8eea",
                brightMagenta: "#d670d6",
                brightCyan: "#29b8db",
                brightWhite: "#e5e5e5",
            },
        });

        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);
        terminal.current.loadAddon(new WebLinksAddon());

        terminal.current.open(element);

        terminal.current.onData((data) => {
            if (!sessionId.current || !terminal.current) {
                console.warn('Terminal input received but no session ID');
                return;
            }

            const code = data.charCodeAt(0);

            // Enter key (carriage return)
            if (code === 13) {
                terminal.current.write('\r\n');
                const command = inputBuffer.current;
                inputBuffer.current = "";

                if (command.trim()) {
                    sendCommand(command + '\n');
                } else {
                    sendCommand('\n');
                }
            }
            // Backspace (127) or Ctrl+H (8)
            else if (code === 127 || code === 8) {
                if (inputBuffer.current.length > 0) {
                    inputBuffer.current = inputBuffer.current.slice(0, -1);
                    terminal.current.write('\b \b');
                }
            }
            // Ctrl+C (3)
            else if (code === 3) {
                terminal.current.write('^C\r\n');
                inputBuffer.current = "";
                sendCommand('\x03');
            }
            // Ctrl+D (4)
            else if (code === 4) {
                sendCommand('\x04');
            }
            // Ctrl+Z (26)
            else if (code === 26) {
                terminal.current.write('^Z\r\n');
                inputBuffer.current = "";
                sendCommand('\x1a');
            }
            // Tab (9)
            else if (code === 9) {
                sendCommand(inputBuffer.current + '\t');
            }
            // Arrow keys and other escape sequences
            else if (data.startsWith('\x1b')) {
                sendCommand(data);
            }
            // Regular printable characters
            else if (code >= 32) {
                inputBuffer.current += data;
                terminal.current.write(data);
            }
        });

        setTimeout(() => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
            connectToServer();
        }, 100);
    };

    useEffect(() => {
        if (!open) {
            hasInitialized.current = false;
            cleanup();
        }
    }, [open]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
        };

        if (open) {
            window.addEventListener("resize", handleResize);
            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    }, [open]);

    const connectToServer = async () => {
        if (!server || !terminal.current) {
            return;
        }

        setIsConnecting(true);
        setError(null);

        terminal.current.writeln(
            `\x1b[33mConnecting to ${server.name} (${server.username}@${server.ip_address}:${server.port})...\x1b[0m`
        );
        terminal.current.writeln("");

        try {
            // Connect via WebSocket endpoint
            const response = await axios.post(route("ssh.websocket.connect"), {
                server_id: server.id,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || "Connection failed");
            }

            sessionId.current = response.data.session_id;
            setIsConnected(true);
            setIsConnecting(false);

            // Display initial output from server
            if (response.data.initial_output && response.data.initial_output.trim()) {
                terminal.current.write(response.data.initial_output);
            } else {
                terminal.current.writeln(
                    `\x1b[32m✓ Connected to ${server.name}\x1b[0m`
                );
                terminal.current.writeln("");
            }

            // Subscribe to WebSocket channel for real-time output
            echo.private(`ssh.${sessionId.current}`)
                .listen('.terminal.output', (event: { output: string; error?: string }) => {
                    if (event.error) {
                        terminal.current?.writeln(`\x1b[31mError: ${event.error}\x1b[0m`);
                    } else if (event.output) {
                        terminal.current?.write(event.output);
                    }
                });

        } catch (err: any) {
            setIsConnecting(false);
            const errorMessage = err.response?.data?.message || err.message || "Failed to connect to server";
            setError(errorMessage);
            terminal.current?.writeln("");
            terminal.current?.writeln(`\x1b[31m✗ Connection failed: ${errorMessage}\x1b[0m`);
            terminal.current?.writeln("");


            if (err.response) {
                console.error("Response data:", err.response);
            }
        }
    };

    const sendCommand = async (input: string) => {
        if (!sessionId.current) {
            return;
        }

        try {
            // Send input via WebSocket endpoint
            const response = await axios.post(route("ssh.websocket.input"), {
                session_id: sessionId.current,
                input: input,
            });

            if (response.data.output) {
                let output = response.data.output;
                output = output.replace(/\r?\n/g, '\r\n');

                terminal.current?.write(output);

                if (!output.endsWith('\r\n')) {
                    terminal.current?.write('\r\n');
                }

                terminal.current?.write('$ ');
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Input failed";

            terminal.current?.writeln(`\x1b[31mError: ${errorMessage}\x1b[0m`);
            terminal.current?.write('$ ');
        }
    };



    const cleanup = () => {
        if (sessionId.current) {
            echo.leave(`ssh.${sessionId.current}`);

            axios
                .post(route("ssh.websocket.disconnect"), {
                    session_id: sessionId.current,
                })
                .catch(() => {
                    // Ignore errors on cleanup
                });
            sessionId.current = null;
        }

        if (terminal.current) {
            terminal.current.dispose();
            terminal.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        setError(null);
    };

    const handleClose = () => {
        cleanup();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[90vw] lg:w-[80rem] lg:max-w-[80rem] h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="flex-row justify-between items-center border-b pl-4 pr-12 py-2">
                    <div className="flex items-center gap-4">
                        <TerminalIcon className="h-5 w-5" />
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                {server?.name || "Terminal"}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {server &&
                                    `${server.username}@${server.ip_address}:${server.port}`}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {isConnecting && (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Connecting...</span>
                                </>
                            )}
                            {isConnected && !error && (
                                <>
                                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                                    <span>Connected</span>
                                </>
                            )}
                            {error && (
                                <>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-red-500">
                                        {error}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => terminal.current?.clear()}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                    <div ref={initializeTerminal} className="h-full w-full p-2" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
