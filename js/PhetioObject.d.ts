import Tandem from "./Tandem";

export type PhetioObjectOptions = {
  tandem: Tandem;
  phetioDocumentation: string;
};
type DefaultOptions = {
  phetioPlayback: boolean
  phetioEventMetadata: Object | null
}
export default class PhetioObject {
  constructor( options: PhetioObjectOptions );

  phetioStartEvent( string: string, options: object );

  phetioEndEvent();

  dispose();

  isPhetioInstrumented():boolean;

  static DEFAULT_OPTIONS: DefaultOptions;
}