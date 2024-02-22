export function checkIsUuid(value: any) {
  const isUuid =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(
      value,
    );

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(value);

  return isUuid || isObjectId;
}
