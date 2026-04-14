export type JsonPrimitive = boolean | number | string | null;
export type JsonObject = {
  [key: string]: JsonValue | undefined;
};
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type ApiErrorInput =
  | Error
  | {
      message?: string;
      status?: number;
    }
  | null
  | undefined;
