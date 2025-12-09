/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `random-focus-session` command */
  export type RandomFocusSession = ExtensionPreferences & {}
  /** Preferences accessible in the `start-focus-session` command */
  export type StartFocusSession = ExtensionPreferences & {}
  /** Preferences accessible in the `focus-history` command */
  export type FocusHistory = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `random-focus-session` command */
  export type RandomFocusSession = {}
  /** Arguments passed to the `start-focus-session` command */
  export type StartFocusSession = {}
  /** Arguments passed to the `focus-history` command */
  export type FocusHistory = {}
}

