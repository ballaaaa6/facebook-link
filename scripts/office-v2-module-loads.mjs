function isIdentifierStart(value) {
  return /[A-Za-z_$]/.test(value);
}

function isIdentifierPart(value) {
  return /[A-Za-z0-9_$]/.test(value);
}

function previousSignificantToken(tokens) {
  return tokens.length > 0 ? tokens[tokens.length - 1] : null;
}

function canStartRegex(previous) {
  if (!previous) return true;
  if (previous.type === "identifier") {
    return new Set([
      "await", "case", "delete", "else", "in", "instanceof", "new", "of",
      "return", "throw", "typeof", "void", "yield",
    ]).has(previous.value);
  }
  return previous.type === "punctuation" && /[([{,:;=!?&|+*%^~<>-]/.test(previous.value);
}

function readQuoted(source, start, quote) {
  let index = start + 1;
  let value = "";
  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      value += character;
      if (index + 1 < source.length) value += source[index + 1];
      index += 2;
      continue;
    }
    if (character === quote) return { end: index + 1, value };
    value += character;
    index += 1;
  }
  return { end: index, value };
}

function skipRegex(source, start) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "[") inCharacterClass = true;
    else if (character === "]") inCharacterClass = false;
    else if (character === "/" && !inCharacterClass) {
      index += 1;
      while (/[A-Za-z]/.test(source[index] ?? "")) index += 1;
      return index;
    }
    index += 1;
  }
  return index;
}

function tokenize(source) {
  const tokens = [];

  function scanTemplate(start) {
    let index = start;
    while (index < source.length) {
      if (source[index] === "\\") {
        index += 2;
      } else if (source[index] === "`") {
        return index + 1;
      } else if (source[index] === "$" && source[index + 1] === "{") {
        index = scanCode(index + 2, true);
      } else {
        index += 1;
      }
    }
    return index;
  }

  function scanCode(start, stopAtTemplateBrace) {
    let index = start;
    let braceDepth = 0;
    while (index < source.length) {
      const character = source[index];
      const next = source[index + 1];
      if (/\s/.test(character)) {
        index += 1;
        continue;
      }
      if (character === "/" && next === "/") {
        index += 2;
        while (index < source.length && !/[\r\n]/.test(source[index])) index += 1;
        continue;
      }
      if (character === "/" && next === "*") {
        const closing = source.indexOf("*/", index + 2);
        index = closing === -1 ? source.length : closing + 2;
        continue;
      }
      if (character === '"' || character === "'") {
        const quoted = readQuoted(source, index, character);
        tokens.push({ type: "string", value: quoted.value });
        index = quoted.end;
        continue;
      }
      if (character === "`") {
        index = scanTemplate(index + 1);
        continue;
      }
      if (character === "/" && canStartRegex(previousSignificantToken(tokens))) {
        index = skipRegex(source, index);
        continue;
      }
      if (isIdentifierStart(character)) {
        let end = index + 1;
        while (end < source.length && isIdentifierPart(source[end])) end += 1;
        tokens.push({ type: "identifier", value: source.slice(index, end) });
        index = end;
        continue;
      }
      if (character === "{" && stopAtTemplateBrace) {
        braceDepth += 1;
      } else if (character === "}" && stopAtTemplateBrace) {
        if (braceDepth === 0) return index + 1;
        braceDepth -= 1;
      }
      tokens.push({ type: "punctuation", value: character });
      index += 1;
    }
    return index;
  }

  scanCode(0, false);
  return tokens;
}

function isToken(token, type, value) {
  return token?.type === type && token.value === value;
}

function findStaticSpecifier(tokens, start) {
  const immediate = tokens[start + 1];
  if (immediate?.type === "string") return immediate.value;
  let depth = 0;
  for (let index = start + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === "punctuation") {
      if (["(", "[", "{"].includes(token.value)) depth += 1;
      else if ([")", "]", "}"].includes(token.value)) depth = Math.max(0, depth - 1);
      else if (token.value === ";" && depth === 0) return null;
    }
    if (
      depth === 0 &&
      isToken(token, "identifier", "from") &&
      tokens[index + 1]?.type === "string"
    ) {
      return tokens[index + 1].value;
    }
    if (
      index > start + 1 &&
      depth === 0 &&
      token.type === "identifier" &&
      ["import", "export"].includes(token.value)
    ) {
      return null;
    }
  }
  return null;
}

export function analyzeModuleLoads(source) {
  const tokens = tokenize(source);
  const loads = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (isToken(token, "identifier", "import")) {
      if (isToken(tokens[index + 1], "punctuation", ".")) continue;
      if (isToken(tokens[index + 1], "punctuation", "(")) {
        const argument = tokens[index + 2];
        loads.push(argument?.type === "string"
          ? { kind: "dynamic", literal: true, specifier: argument.value }
          : { kind: "dynamic", literal: false, specifier: null });
      } else {
        const specifier = findStaticSpecifier(tokens, index);
        if (specifier !== null) loads.push({ kind: "static", literal: true, specifier });
      }
    } else if (isToken(token, "identifier", "export")) {
      const specifier = findStaticSpecifier(tokens, index);
      if (specifier !== null) loads.push({ kind: "static", literal: true, specifier });
    } else if (
      isToken(token, "identifier", "require") &&
      !isToken(tokens[index - 1], "punctuation", ".") &&
      isToken(tokens[index + 1], "punctuation", "(")
    ) {
      const argument = tokens[index + 2];
      loads.push(argument?.type === "string"
        ? { kind: "require", literal: true, specifier: argument.value }
        : { kind: "require", literal: false, specifier: null });
    }
  }
  return loads;
}
