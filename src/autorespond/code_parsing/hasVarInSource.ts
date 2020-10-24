import * as ts from 'typescript';

export function hasVarInSource(source: string): boolean {
  // Build a program using the set of root file names in fileNames
  const sourceFile = ts.createSourceFile(
    'file.ts',
    source,
    ts.ScriptTarget.Latest,
    true
  );
  return !!sourceFile.forEachChild(visit);
}

function visit(node: ts.Node) {
  if (node.kind === ts.SyntaxKind.VariableDeclarationList) {
    return node.getFirstToken().kind === ts.SyntaxKind.VarKeyword;
  }

  return node.forEachChild(visit);
}
