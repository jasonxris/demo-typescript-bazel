/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from "vscode";
import { workspace, ExtensionContext } from 'vscode';
import { JavaUtils, WorkspaceUtils } from "./utils";

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

const MESSAGES = {
	init: "Starting up Bazel language server...",
	initFailed: "The Bazel extension failed to start.",
	invalidJava: "The bazel.java.home setting does not point to a valid JDK.",
	missingJava:
	  "Could not locate valid JDK. To configure JDK manually, " +
	  "use the bazel.java.home setting.",
	reloadToApplySettings: "Reload the window to apply new settings for Bazel.",
};

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	

	// Options to control the language client
	// let clientOptions: LanguageClientOptions = {
	// 	// Register the server for plain text documents
	// 	documentSelector: [{ scheme: 'file', language: 'plaintext' }],
	// 	synchronize: {
	// 		// Notify the server about file changes to '.clientrc files contained in the workspace
	// 		fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
	// 	}
	// };


	const clientOptions: LanguageClientOptions= {
		documentSelector: [
		  { scheme: "file", language: WorkspaceUtils.LANGUAGES.starlark.id },
		],
		synchronize: {
		  configurationSection: WorkspaceUtils.CONFIG.bazelConfig,
		  fileEvents: [
			vscode.workspace.createFileSystemWatcher(
			  `**/.{${WorkspaceUtils.LANGUAGES.starlark.extensions}}`,
			),
			vscode.workspace.createFileSystemWatcher(
			  `**/{${WorkspaceUtils.LANGUAGES.starlark.filenames}}`,
			),
		  ],
		},
		uriConverters: {
		  code2Protocol: (value: vscode.Uri) => {
			if (/^win32/.test(process.platform)) {
			  // Drive letters on Windows are encoded with "%3A" instead of
			  // ":", but Java doesn't treat them the same
			  return value.toString().replace("%3A", ":");
			} else {
			  return value.toString();
			}
		  },
		  // This is just the default behavior, but we need to define both.
		  protocol2Code: (value) => vscode.Uri.parse(value),
		},
	  };

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
