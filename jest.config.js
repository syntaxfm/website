module.exports = {
  // setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/scripts/"]
};

// module.exports = {
//   collectCoverageFrom: [
//     "components/**/*.{js,jsx}",
//     "lib/**/*.{js,jsx}",
//     "pages/**/*.{js,jsx}"
//   ],
//   testMatch: [
//     "<rootDir>/app/**/__tests__/**/*.{js,jsx}",
//     "<rootDir>/app/**/?(*.)(spec|test).{js,jsx}",
//     "<rootDir>/lib/**/__tests__/**/*.{js,jsx}",
//     "<rootDir>/lib/**/?(*.)(spec|test).{js,jsx}",
//     "<rootDir>/pages/**/__tests__/**/*.{js,jsx}",
//     "<rootDir>/pages/**/?(*.)(spec|test).{js,jsx}"
//   ],
//   testEnvironment: "node",
//   testURL: "http://localhost",
//   transform: {
//     "^.+\\.(js|jsx)$": "<rootDir>/node_modules/babel-jest",
//     "^.+\\.css$": "<rootDir>/lib/cssTransform.js",
//     "^(?!.*\\.(js|jsx|mjs|css|json)$)": "<rootDir>/lib/fileTransform.js"
//   },
//   transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$"],
//   moduleFileExtensions: ["js", "json", "jsx", "node"],
//   moduleDirectories: ["node_modules", "app", "internals"]
// };
