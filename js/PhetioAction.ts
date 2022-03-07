// Copyright 2022, University of Colorado Boulder

/**
 * An instrumented class that wraps a function that does work that needs to be interoperable. PhetioAction supports
 * adding its executed action to the PhET-iO data stream, and an IOType with an API to execute that function.
 *
 * TODO: It also has an emitter if you want to listen to when the action is done doing its work, https://github.com/phetsims/phet-io/issues/1543
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import optionize from '../../phet-core/js/optionize.js';
import Tandem from './Tandem.js';
import VoidIO from './types/VoidIO.js';
import PhetioDataHandler, { PhetioDataHandlerOptions } from './PhetioDataHandler.js';
import validate from '../../axon/js/validate.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

type Constructor = new ( ...args: any[] ) => {};

type ValueType = Constructor | string | null;

type Parameter = {
  name?: string;
  phetioType?: IOType;
  phetioDocumentation?: string;
  phetioPrivate?: boolean;
  valueType?: ValueType | ValueType[];
  validValues?: any[]
};

// Simulations have thousands of Emitters, so we re-use objects where possible.
const EMPTY_ARRAY: Parameter[] = [];
assert && Object.freeze( EMPTY_ARRAY );

// By default, PhetioActions are not stateful
const PHET_IO_STATE_DEFAULT = false;

export type ActionOptions = Partial<PhetioDataHandlerOptions>;

class PhetioAction<T extends any[] = []> extends PhetioDataHandler<T> {

  private readonly action: () => void;

  static PhetioActionIO: ( parameterTypes: IOType[] ) => IOType;

  /**
   * @param action - the function that is called when this PhetioAction occurs
   * @param providedOptions
   */
  constructor( action: ( ...args: T ) => any, providedOptions?: ActionOptions ) {
    const options = optionize<ActionOptions, {}, PhetioDataHandlerOptions, 'phetioOuterType'>( {

      // {Object[]} - see PARAMETER_KEYS for a list of legal keys, their types, and documentation
      parameters: EMPTY_ARRAY,

      phetioOuterType: PhetioAction.PhetioActionIO,
      phetioState: PHET_IO_STATE_DEFAULT,
      tandem: Tandem.OPTIONAL,
      phetioDocumentation: 'A class that wraps a function, adding API to execute that function and data stream capture.'
    }, providedOptions );

    super( options );

    this.action = action;

    // TODO: make ze emitter, https://github.com/phetsims/phet-io/issues/1543
  }

  /**
   * Invokes the action.
   * @params - expected parameters are based on options.parameters, see constructor
   */
  execute( ...args: T ) {
    if ( assert ) {
      assert( args.length === this.parameters.length,
        `Emitted unexpected number of args. Expected: ${this.parameters.length} and received ${args.length}`
      );
      for ( let i = 0; i < this.parameters.length; i++ ) {
        const parameter = this.parameters[ i ];
        validate( args[ i ], parameter, 'argument does not match provided parameter validator', VALIDATE_OPTIONS_FALSE );

        // valueType overrides the phetioType validator so we don't use that one if there is a valueType
        if ( parameter.phetioType && !parameter.valueType ) {
          validate( args[ i ], parameter.phetioType.validator, 'argument does not match parameter\'s phetioType validator', VALIDATE_OPTIONS_FALSE );
        }
      }
    }

    // handle phet-io data stream for the emitted event
    this.phetioStartEvent( 'executed', {
      getData: () => this.getPhetioData( ...args ) // put this in a closure so that it is only called in phet-io brand
    } );

    // @ts-ignore
    this.action.apply( null, args );

    this.phetioEndEvent();
  }
}

const paramToTypeName = ( param: IOType ) => param.typeName;


// {Map.<parameterType:IOType, IOType>} - cache each parameterized IOType so that it is only created once.
const cache = new Map();

PhetioAction.PhetioActionIO = ( parameterTypes: IOType[] ) => {
  const key = parameterTypes.map( paramToTypeName ).join( ',' );
  if ( !cache.has( key ) ) {
    cache.set( key, new IOType( `PhetioActionIO<${parameterTypes.map( paramToTypeName ).join( ', ' )}>`, {
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
  return cache.get( key );
};

tandemNamespace.register( 'PhetioAction', PhetioAction );
export default PhetioAction;