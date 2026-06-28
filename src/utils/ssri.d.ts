declare module "ssri" {
  export function checkData(data: Buffer | string, integrity: string): boolean | object;
  export function fromData(data: Buffer | string): { toString(): string };
}
