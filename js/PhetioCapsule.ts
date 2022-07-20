// Copyright 2019-2022, University of Colorado Boulder

/**
 * A PhET-iO class that encapsulates a PhetioObject that is not created during sim startup to provide PhET-iO API
 * validation, API communication (like to view in studio before creation), and to support PhET-iO state if applicable.
 *
 * Constructing a PhetioCapsule creates a container encapsulating a wrapped element that can be of any type.
 *
 * Clients should use myCapsule.getElement() instead of storing the element value itself.
 *
 * NOTE: Be careful about treating the dynamic element as a singleton. When creating the archetype, problems can arise
 * because the capsule creates two instances of the element: one as the archetype and one as the instance. This can
 * result in trouble like in https://github.com/phetsims/joist/issues/821.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import PhetioDynamicElementContainer, { DynamicElementContainerClearOptions, PhetioDynamicElementContainerOptions } from './PhetioDynamicElementContainer.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import PhetioObject from './PhetioObject.js';
import { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import optionize from '../../phet-core/js/optionize.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Capsule';

export type PhetioCapsuleOptions = PhetioDynamicElementContainerOptions;

class PhetioCapsule<T extends PhetioObject, P extends IntentionalAny[] = []> extends PhetioDynamicElementContainer<T, P> {
  private element: T | null;
  public static PhetioCapsuleIO: ( parameterType: IOType ) => IOType;

  /**
   * @param createElement - function that creates the encapsulated element
   * @param defaultArguments - arguments passed to createElement when creating the archetype
   * @param [options]
   */
  public constructor( createElement: ( t: Tandem, ...p: P ) => T, defaultArguments: P | ( () => P ), options?: PhetioCapsuleOptions ) {

    options = optionize<PhetioCapsuleOptions, EmptySelfOptions>()( {
      tandem: Tandem.OPTIONAL,

      // {string} The capsule's tandem name must have this suffix, and the base tandem name for its wrapped element
      // will consist of the capsule's tandem name with this suffix stripped off.
      containerSuffix: DEFAULT_CONTAINER_SUFFIX
    }, options );

    super( createElement, defaultArguments, options );

    // (read-only PhetioCapsuleIO) {PhetioObject}
    this.element = null;
  }

  /**
   * Dispose the underlying element.  Called by the PhetioStateEngine so the capsule element can be recreated with the
   * correct state.
   * @param [fromStateSetting] - Used for validation during state setting, see PhetioDynamicElementContainer.disposeElement()
   */
  // @ts-ignore
  public disposeElement( fromStateSetting = false ): void {
    assert && assert( this.element, 'cannot dispose if element is not defined' );
    super.disposeElement( this.element!, fromStateSetting );
    this.element = null;
  }

  public hasElement(): boolean {
    return this.element !== null;
  }

  /**
   * Creates the element if it has not been created yet, and returns it.
   */
  public getElement( ...argsForCreateFunction: P ): T {
    if ( !this.element ) {
      this.create( argsForCreateFunction );
    }
    assert && assert( this.element !== null );
    return this.element!;
  }

  public override clear( providedOptions?: DynamicElementContainerClearOptions ): void {
    const options = optionize<DynamicElementContainerClearOptions, EmptySelfOptions>()( {

      // Used for validation during state setting. See PhetioDynamicElementContainer.disposeElement() for documentation
      fromStateSetting: false
    }, providedOptions );

    if ( this.element ) {
      this.disposeElement( options.fromStateSetting );
    }
  }

  /**
   * Primarily for internal use, clients should usually use getElement.
   * @param argsForCreateFunction
   * @param [fromStateSetting] - used for validation during state setting, see PhetioDynamicElementContainer.disposeElement() for documentation
   * (phet-io)
   */
  public create( argsForCreateFunction: P, fromStateSetting = false ): T {
    assert && assert( this.isPhetioInstrumented(), 'TODO: support uninstrumented PhetioCapsules? see https://github.com/phetsims/tandem/issues/184' );

    assert && this.supportsDynamicState && _.hasIn( window, 'phet.joist.sim.' ) &&
    phet.joist.sim.isSettingPhetioStateProperty.value && assert( fromStateSetting,
      'dynamic elements should only be created by the state engine when setting state.' );

    // create with default state and substructure, details will need to be set by setter methods.
    this.element = this.createDynamicElement(
      this.phetioDynamicElementName,
      argsForCreateFunction,
      Tandem.PHET_IO_ENABLED ? this.phetioType.parameterTypes![ 0 ] : null // Don't access phetioType in PhET brand
    );

    this.notifyElementCreated( this.element );

    return this.element;
  }
}

// {Map.<parameterType:IOType, IOType>} - cache each parameterized IOType so that it is only created once.
const cache = new Map();

/**
 * Parametric IO Type constructor.  Given an element type, this function returns a PhetioCapsule IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param parameterType
 * @constructor
 */
PhetioCapsule.PhetioCapsuleIO = parameterType => {

  assert && assert( parameterType instanceof IOType, 'element type should be an IO Type' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `PhetioCapsuleIO<${parameterType.typeName}>`, {
      valueType: PhetioCapsule,
      documentation: 'An array that sends notifications when its values have changed.',
      parameterTypes: [ parameterType ],

      // This is always specified by PhetioCapsule, and will never be this value. Yes, it is odd to have a default value
      // that can never be the actual value, but we thought it would be simplest to reuse the "options" pipeline
      // rather than inventing a new "required" pipeline.
      metadataDefaults: { phetioDynamicElementName: null },

      // @ts-ignore
      addChildElement( capsule, componentName, stateObject ) {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateToArgsForConstructor( stateObject );
        return capsule.create( args, true );
      }
    } ) );
  }

  return cache.get( parameterType );
};

tandemNamespace.register( 'PhetioCapsule', PhetioCapsule );
export default PhetioCapsule;