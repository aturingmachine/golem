export enum AliasFunctionType {
  Random = ':random',
  RandomNumber = ':randomNum',
}

export abstract class AAliasFunction {
  public abstract type: AliasFunctionType

  constructor(public evalString: string) {}

  abstract run(): string
}
