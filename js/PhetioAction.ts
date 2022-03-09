// Copyright 2022, University of Colorado Boulder

/**
 * An instrumented class that wraps a function that does "work" that needs to be interoperable with PhET-iO.
 * PhetioAction supports the following features:
 *
 * 1. Data stream support: The function will be wrapped in an `executed` event and added to the data stream, nesting
 * subsequent events the action's "work" cascades to as child events.
 * 2. Interopererability: PhetioActionIO supports the `execute` method so that PhetioAction instances can be executed
 * from the PhET-iO wrapper.
 * 3. It also has an emitter if you want to listen to when the action is done doing its work, https://github.com/phetsims/phet-io/issues/1543
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import optionize from '../../phet-core/js/optionize.js';
import Tandem from './Tandem.js';
import VoidIO from './types/VoidIO.js';
import PhetioDataHandler, { Parameter, PhetioDataHandlerOptions } from './PhetioDataHandler.js';
import IntentionalAny from '../../phet-core/js/IntentionalAny.js';
import Emitter from '../../axon/js/Emitter.js';
import PhetioObject from './PhetioObject.js';

const EMPTY_ARRAY: Parameter[] = [];

// By default, PhetioActions are not stateful
const PHET_IO_STATE_DEFAULT = false;

export type ActionOptions = Partial<PhetioDataHandlerOptions>;

class PhetioAction<T extends IntentionalAny[] = []> extends PhetioDataHandler<T> {

  private readonly action: ( ...args: T ) => void;

  // To listen to when the action has completed.
  readonly executedEmitter: Emitter<T>;

  static PhetioActionIO: ( parameterTypes: IOType[] ) => IOType;

  /**
   * @param action - the function that is called when this PhetioAction occurs
   * @param providedOptions
   */
  constructor( action: ( ...args: T ) => void, providedOptions?: ActionOptions ) {
    const options = optionize<ActionOptions, {}, PhetioDataHandlerOptions, 'phetioOuterType' | 'tandem'>( {

      // We need to defined this here in addition to PhetioDataHandler to pass to executedEmitter
      parameters: EMPTY_ARRAY,

      // PhetioDataHandler
      phetioOuterType: PhetioAction.PhetioActionIO,

      // PhetioObject
      tandem: Tandem.OPTIONAL,
      phetioState: PHET_IO_STATE_DEFAULT,
      phetioReadOnly: PhetioObject.DEFAULT_OPTIONS.phetioReadOnly,
      phetioHighFrequency: PhetioObject.DEFAULT_OPTIONS.phetioHighFrequency,
      phetioEventType: PhetioObject.DEFAULT_OPTIONS.phetioEventType,
      phetioDocumentation: 'A class that wraps a function, adding API to execute that function and data stream capture.'
    }, providedOptions );

    super( options );

    this.action = action;

    this.executedEmitter = new Emitter<T>( {
      parameters: options.parameters,
      tandem: options.tandem.createTandem( 'executedEmitter' ),
      phetioState: options.phetioState,
      phetioReadOnly: options.phetioReadOnly,
      phetioHighFrequency: options.phetioHighFrequency,
      phetioEventType: options.phetioEventType,
      phetioDocumentation: 'Emitter that emits when this actions work is complete'
    } );
  }

  /**
   * Invokes the action.
   * @params - expected parameters are based on options.parameters, see constructor
   */
  execute( ...args: T ): void {
    assert && super.validateArguments( ...args );

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent( 'executed', {
      getData: () => this.getPhetioData( ...args ) // put this in a closure so that it is only called in phet-io brand
    } );

    this.action.apply( null, args );

    this.executedEmitter.emit( ...args );

    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  dispose(): void {
    this.executedEmitter.dispose();
    super.dispose();
  }
}

const getTypeName = ( ioType: IOType ) => ioType.typeName;

// cache each parameterized IOType so that it is only created once.
const cache = new Map<string, IOType>();

PhetioAction.PhetioActionIO = ( parameterTypes: IOType[] ) => {
  const key = parameterTypes.map( getTypeName ).join( ',' );
  if ( !cache.has( key ) ) {
    cache.set( key, new IOType( `PhetioActionIO<${parameterTypes.map( getTypeName ).join( ', ' )}>`, {
      valueType: PhetioAction,
      documentation: 'Executes when an event occurs',
      events: [ 'executed' ],
      parameterTypes: parameterTypes,
      metadataDefaults: {
        phetioState: PHET_IO_STATE_DEFAULT
      },
      methods: {
        execute: {
          returnType: VoidIO,
          parameterTypes: parameterTypes,

          // Match `PhetioAction.execute`'s dynamic number of arguments
          implementation: function( ...args: any[] ) {

            // @ts-ignore
            this.execute( ...args );
          },
          documentation: 'Executes the function the PhetioAction is wrapping.',
          invocableForReadOnlyElements: false
        }
      }
    } ) );
  }
  return cache.get( key )!;
};

tandemNamespace.register( 'PhetioAction', PhetioAction );
export default PhetioAction;