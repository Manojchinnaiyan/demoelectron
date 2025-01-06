import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerWix } from "@electron-forge/maker-wix";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { PublisherGithub } from "@electron-forge/publisher-github";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

// Read version from package.json
import pkg from "./package.json";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./assets/icon", // Make sure you have icon.ico for Windows
    appCopyright: `Copyright © ${new Date().getFullYear()} Your Company`,
    win32metadata: {
      CompanyName: "Your Company",
      FileDescription: pkg.description,
      OriginalFilename: `${pkg.name}.exe`,
      ProductName: pkg.productName || pkg.name,
      InternalName: pkg.name,
    },
  },
  rebuildConfig: {},
  makers: [
    // Keep your existing makers
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
    // Add WiX maker
    new MakerWix({
      language: 1033, // English
      manufacturer: "Your Company Name",
      name: pkg.productName || pkg.name,
      upgradeCode: "YOUR-GUID-HERE", // Generate using [guid]::NewGuid()
      icon: "./assets/icon.ico",
      ui: {
        chooseDirectory: true,
      },
      features: {
        autoUpdate: true,
        autoLaunch: true,
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "your-github-username",
        name: "your-repo-name",
      },
      prerelease: false,
      draft: false,
      tagPrefix: "v", // Tags will be like v1.0.0
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
