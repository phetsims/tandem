// Copyright 2019-2022, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic elements may be created.  Checks that elements of the group
 * match the approved schema.
 *
 * In general when creating an element, any extra wiring or listeners should not be added. These side effects are a code
 * smell in the `createElement` parameter. Instead attach a listener for when elements are created, and wire up listeners
 * there. Further documentation about using PhetioGroup can be found at
 * https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#dynamically-created-phet-io-elements
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import NumberProperty from '../../axon/js/NumberProperty.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import PhetioDynamicElementContainer from './PhetioDynamicElementContainer.js';
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Group';

// Type of a derivation function, that returns T and takes the typed parameters (as a tuple type)
// type Derivation<T, Parameters extends any[]> = ( ...params: Parameters ) => T;

// A extends ( ...args: any[] ) => any, B extends Parameters<A>
class PhetioGroup<T extends PhetioObject, A = never, B = never, C = never, D = never, E = never> extends PhetioDynamicElementContainer<T, A, B, C, D, E> {
  _array: T[];
  groupElementIndex: number;
  countProperty: NumberProperty;
  static PhetioGroupIO: ( parameterType: any ) => any;

  // TODO: Should this use <T extends any[] = []> like TinyEmitter? see https://github.com/phetsims/tandem/issues/254
  constructor( createElement: ( tandem: Tandem, a: A ) => T, defaultArguments: [ A ] | ( () => [ A ] ), options: any );
  constructor( createElement: ( tandem: Tandem, a: A, b: B ) => T, defaultArguments: [ A, B ] | ( () => [ A, B ] ), options: any );
  constructor( createElement: ( tandem: Tandem, a: A, b: B, c: C ) => T, defaultArguments: [ A, B, C ] | ( () => [ A, B, C ] ), options: any );
  constructor( createElement: ( tandem: Tandem, a: A, b: B, c: C, d: D ) => T, defaultArguments: [ A, B, C, D ] | ( () => [ A, B, C, D ] ), options: any );
  constructor( createElement: ( tandem: Tandem, a: A, b: B, c: C, d: D, e: E ) => T, defaultArguments: [ A, B, C, D, E ] | ( () => [ A, B, C, D, E ] ), options: any );

  /**
   * @param {function(Tandem,...):PhetioObject} createElement - function that creates a dynamic element to be housed in
   * this container. All of this dynamic element container's elements will be created from this function, including the
   * archetype.
   * @param {Array.<*>|function():Array.<*>} defaultArguments - arguments passed to createElement when creating the archetype.
   *                                       Note: if `createElement` supports options, but don't need options for this
   *                                       defaults array, you should pass an empty object here anyways.
   * @param {Object} [options] - describe the Group itself
   */
  constructor( createElement: any, defaultArguments: any, options?: any ) {

    options = merge( {
      tandem: Tandem.OPTIONAL,

      // {string} The group's tandem name must have this suffix, and the base tandem name for elements of
      // the group will consist of the group's tandem name with this suffix stripped off.
      containerSuffix: DEFAULT_CONTAINER_SUFFIX
    }, options );

    super( createElement, defaultArguments, options );

    // @public (PhetioGroupTests only) {PhetioObject[]} access using getArray or getArrayCopy
    this._array = [];

    // @public (only for PhetioGroupIO) - for generating indices from a pool
    this.groupElementIndex = 0;

    // @public (read-only)
    this.countProperty = new NumberProperty( 0, {
      tandem: options.tandem.createTandem( 'countProperty' ),
      phetioDocumentation: 'the number of elements in the group',
      phetioReadOnly: true,
      phetioFeatured: true,
      numberType: 'Integer'
    } );

    assert && this.countProperty.link( count => {
      assert && assert( count === this._array.length, `${this.countProperty.tandem.phetioID} listener fired and array length differs, count=${count}, arrayLength=${this._array.length}` );
    } );

    // countProperty can be overwritten during state set, see PhetioGroup.createIndexedElement(), and so this assertion
    // makes sure that the final length of the elements array matches the expected count from the state.
    assert && Tandem.VALIDATION && phet.phetio.phetioEngine.phetioStateEngine.stateSetEmitter.addListener( ( state: any ) => {

      // This supports cases when only partial state is being set
      if ( state[ this.countProperty.tandem.phetioID ] ) {
        assert && assert( state[ this.countProperty.tandem.phetioID ].value === this._array.length, `${this.countProperty.tandem.phetioID} should match array length.  Expected ${state[ this.countProperty.tandem.phetioID ].value} but found ${this._array.length}` );
      }
    } );
  }

  /**
   * @public
   */
  dispose() {
    assert && assert( false, 'PhetioGroup not intended for disposal' );
  }

  /**
   * Remove an element from this Group, unregistering it from PhET-iO and disposing it.
   * The order is guaranteed to be:
   * 1. remove from internal array
   * 2. update countProperty
   * 3. element.dispose
   * 4. fire elementDisposedEmitter
   *
   * @param {T} element
   * @param {boolean} [fromStateSetting] - Used for validation during state setting. See PhetioDynamicElementContainer.disposeElement() for documentation
   * @public
   * @override
   */
  disposeElement( element: T, fromStateSetting = false ) {
    assert && assert( !element.isDisposed, 'element already disposed' );
    arrayRemove( this._array, element );

    this.countProperty.value = this._array.length;

    super.disposeElement( element, fromStateSetting );
  }

  /**
   * Gets a reference to the underlying array. DO NOT create/dispose elements while iterating, or otherwise modify
   * the array.  If you need to modify the array, use getArrayCopy.
   * @returns {T[]}
   * @public
   */
  getArray() {
    return this._array;
  }

  /**
   * Gets a copy of the underlying array. Use this method if you need to create/dispose elements while iterating,
   * or otherwise modify the group's array.
   * @returns {T[]}
   * @public
   */
  getArrayCopy() {
    return this._array.slice();
  }

  /**
   * Returns the element at the specified index
   */
  getElement( index: number ): T {
    return this._array[ index ];
  }

  /**
   * Gets the number of elements in the group.
   */
  get count(): number { return this.countProperty.value; }

  /**
   * Returns an array with elements that pass the filter predicate.
   * @param {function(PhetioObject)} predicate
   * @returns {T[]}
   * @public
   */
  filter( predicate: ( t: T ) => boolean ) { return this._array.filter( predicate ); }

  /**
   * Does the group include the specified element?
   */
  includes( element: T ) { return this._array.includes( element ); }

  /**
   * Gets the index of the specified element in the underlying array.
   * @param {T} element
   * @returns {number} - index, -1 if not found
   */
  indexOf( element: T ): number { return this._array.indexOf( element ); }

  /**
   * Runs the function on each element of the group.
   */
  forEach( action: ( t: T ) => void ) { this._array.forEach( action ); }

  /**
   * Use the predicate to find the first matching occurrence in the array.
   */
  find( predicate: ( t: T ) => boolean ) { return this._array.find( predicate ); }

  /**
   * Returns an array with every element mapped to a new one.
   */
  map<U>( f: ( t: T ) => U ) { return this._array.map( f ); }

  /**
   * Remove and dispose all registered group elements
   */
  clear( options?: any ) {
    options = merge( {

      // used for validation during state setting (phet-io internal), see PhetioDynamicElementContainer.disposeElement for documentation
      fromStateSetting: false,

      // whether the group's index is reset to 0 for the next element created
      resetIndex: true
    }, options );

    while ( this._array.length > 0 ) {

      // An earlier draft removed elements from the end (First In, Last Out). However, listeners that observe this list
      // often need to run arrayRemove for corresponding elements, which is based on indexOf and causes an O(N^2) behavior
      // by default (since the first removal requires skimming over the entire list). Hence we prefer First In, First
      // Out, so that listeners will have O(n) behavior for removal from associated lists.
      // See https://github.com/phetsims/natural-selection/issues/252
      this.disposeElement( this._array[ 0 ], options.fromStateSetting );
    }

    if ( options.resetIndex ) {
      this.groupElementIndex = 0;
    }
  }

  /**
   * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
   * so that electron_0 corresponds to electronNode_0 and so on.
   * @param tandemName - the tandem name of the model element
   * @param argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type
   *                                      `stateToArgsForConstructor` method
   */
  createCorrespondingGroupElement( tandemName: string, ...argsForCreateFunction: any[] ) {

    // @ts-ignore
    const index = window.phetio.PhetioIDUtils.getGroupElementIndex( tandemName );

    // If the specified index overlapped with the next available index, bump it up so there is no collision on the
    // next createNextElement
    if ( this.groupElementIndex === index ) {
      this.groupElementIndex++;
    }
    return this.createIndexedElement( index, argsForCreateFunction );
  }

  /**
   * Creates the next group element.
   * @param argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type
   *                                      `stateToArgsForConstructor` method
   */
  createNextElement( ...argsForCreateFunction: any[] ): T {
    return this.createIndexedElement( this.groupElementIndex++, argsForCreateFunction );
  }

  /**
   * Primarily for internal use, clients should usually use createNextElement.
   * The order is guaranteed to be:
   * 1. instantiate element
   * 2. add to internal array
   * 3. update countProperty
   * 4. fire elementCreatedEmitter
   *
   * @param index - the number of the individual element
   * @param argsForCreateFunction
   * @param [fromStateSetting] - Used for validation during state setting. See PhetioDynamicElementContainer.disposeElement() for documentation
   * @public (PhetioGroupIO)
   */
  createIndexedElement( index: number, argsForCreateFunction: any[], fromStateSetting = false ): T {
    assert && Tandem.VALIDATION && assert( this.isPhetioInstrumented(), 'TODO: support uninstrumented PhetioGroups? see https://github.com/phetsims/tandem/issues/184' );

    assert && this.supportsDynamicState && _.hasIn( window, 'phet.joist.sim' ) &&
    assert && phet.joist.sim.isSettingPhetioStateProperty.value && assert( fromStateSetting,
      'dynamic elements should only be created by the state engine when setting state.' );

    // @ts-ignore
    const componentName = this.phetioDynamicElementName + window.phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

    // Don't access phetioType in PhET brand
    const containerParameterType = Tandem.PHET_IO_ENABLED ? this.phetioType.parameterTypes[ 0 ] : null;

    const groupElement = this.createDynamicElement( componentName, argsForCreateFunction, containerParameterType );

    this._array.push( groupElement );

    this.countProperty.value = this._array.length;

    this.notifyElementCreated( groupElement );

    return groupElement;
  }
}

// {Map.<parameterType:IOType, IOType>} - cache each parameterized IOType so that it is only created once.
const cache = new Map();

/**
 * Parametric IO Type constructor.  Given an element type, this function returns a PhetioGroup IO Type.
 * @param {IOType} parameterType
 * @returns {IOType}
 */
PhetioGroup.PhetioGroupIO = parameterType => {

  assert && assert( parameterType instanceof IOType, 'element type should be defined' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `PhetioGroupIO<${parameterType.typeName}>`, {

      isValidValue: ( v: any ) => {

        // @ts-ignore
        const PhetioGroup = window.phet ? phet.tandem.PhetioGroup : tandemNamespace.PhetioGroup;
        return v instanceof PhetioGroup;
      },
      documentation: 'An array that sends notifications when its values have changed.',

      // This is always specified by PhetioGroup, and will never be this value.
      // See documentation in PhetioCapsule
      metadataDefaults: { phetioDynamicElementName: null },
      parameterTypes: [ parameterType ],

      /**
       * Creates an element and adds it to the group
       * @throws CouldNotYetDeserializeError - if it could not yet deserialize
       * @public (PhetioStateEngine)
       */
      addChildElement( group: PhetioGroup<any>, componentName: string, stateObject: any ): PhetioObject {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateToArgsForConstructor( stateObject );

        // @ts-ignore
        const index = window.phetio.PhetioIDUtils.getGroupElementIndex( componentName );

        const groupElement = group.createIndexedElement( index, args, true );

        // Keep the groupElementIndex in sync so that the next index is set appropriately. This covers the case where
        // no elements have been created in the sim, instead they have only been set via state.
        group.groupElementIndex = Math.max( index + 1, group.groupElementIndex );

        return groupElement;
      }
    } ) );
  }

  return cache.get( parameterType );
};

tandemNamespace.register( 'PhetioGroup', PhetioGroup );
export default PhetioGroup;