const dependencySections = [
  "dependencies", "optionalDependencies", "peerDependencies", "devDependencies",
];

function diagnostic(code, path, message, context = {}) {
  return { code, owner: "architecture", version: 1, path, message, context };
}

function findOfficePackage(specifier, packageRules) {
  return packageRules.find(
    (rule) => specifier === rule.name || specifier.startsWith(`${rule.name}/`),
  );
}

export function evaluateOfficeV2ConsumerManifest(
  projectRoot,
  record,
  packageRules,
  webPackageRoot,
) {
  const diagnostics = [];
  const manifestPath = `${projectRoot}/package.json`;
  if (record.parseError) {
    diagnostics.push(diagnostic(
      "architecture.office-v2.invalid-manifest",
      manifestPath,
      "Workspace package manifest is not valid JSON.",
      { reason: record.parseError },
    ));
    return diagnostics;
  }

  const manifest = record.value ?? record;
  for (const section of dependencySections) {
    for (const [dependency, version] of Object.entries(manifest[section] ?? {})) {
      const officePackage = findOfficePackage(dependency, packageRules);
      if (!officePackage) continue;

      if (projectRoot !== webPackageRoot) {
        diagnostics.push(diagnostic(
          "architecture.office-v2.dependency-direction",
          manifestPath,
          `Only ${webPackageRoot} may declare Office V2 package dependencies.`,
          {
            allowedConsumer: webPackageRoot,
            dependency,
            package: manifest.name ?? null,
            section,
          },
        ));
      } else if (dependency !== officePackage.name) {
        diagnostics.push(diagnostic(
          "architecture.office-v2.public-entrypoint",
          manifestPath,
          `Web composition dependencies must use the public package root ${officePackage.name}.`,
          { dependency, package: manifest.name ?? null, section },
        ));
      } else if (section !== "dependencies") {
        diagnostics.push(diagnostic(
          "architecture.office-v2.dependency-section",
          manifestPath,
          `Workspace dependency ${dependency} must be declared in dependencies.`,
          { dependency, package: manifest.name ?? null, section },
        ));
      } else if (version !== "0.1.0") {
        diagnostics.push(diagnostic(
          "architecture.office-v2.dependency-version",
          manifestPath,
          `Workspace dependency ${dependency} must use version 0.1.0.`,
          { actual: version, dependency, package: manifest.name ?? null },
        ));
      }
    }
  }

  return diagnostics;
}
