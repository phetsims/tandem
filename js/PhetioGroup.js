// Copyright 2019-2020, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic elements may be created.  Checks that elements of the group
 * match the approved schema.
 *
 * In general when creating an element, any extra wiring or listeners should not be added. These side effects are a code
 * smell in the `createElement` parameter. Instead attach a listener for when elements are created, and wire up listeners
 * there. Further documentation about using PhetioGroup can be found at
 * https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-guide.md#dynamically-created-phet-io-elements
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import NumberProperty from '../../axon/js/NumberProperty.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import PhetioDynamicElementContainer from './PhetioDynamicElementContainer.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Group';

class PhetioGroup extends PhetioDynamicElementContainer {

  /**
   * @param {function(Tandem,...):PhetioObject} createElement - function that creates a dynamic element to be housed in
   * this container. All of this dynamic element container's elements will be created from this function, including the
   * archetype.
   * @param {Array<*>|function():Array<*>} defaultArguments - arguments passed to createElement when creating the archetype
   * @param {Object} [options] - describe the Group itself
   */
  constructor( createElement, defaultArguments, options ) {

    options = merge( {
      tandem: Tandem.REQUIRED,

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

    assert && this.countProperty.link( count => assert( count === this._array.length, 'countProperty should match array length.' ) );

    // countProperty can be overwritten during state set, see PhetioGroup.createIndexedELement(), and so this assertion
    // makes sure that the final length of the elements array matches the expected count from the state.
    assert && Tandem.VALIDATION && phet.phetio.phetioEngine.phetioStateEngine.stateSetEmitter.addListener( state => {

      // This supports cases when only partial state is being set
      if ( state[ this.countProperty.tandem.phetioID ] ) {
        assert( state[ this.countProperty.tandem.phetioID ].value === this._array.length, 'countProperty should match array length.' );
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
   * @param {PhetioObject} element
   * @param {boolean} [fromStateSetting] - Used for validation during state setting. See PhetioDynamicElementContainer.disposeElement() for documentation
   * @public
   * @override
   */
  disposeElement( element, fromStateSetting ) {
    arrayRemove( this._array, element );

    this.countProperty.value = this._array.length;

    super.disposeElement( element, fromStateSetting );
  }

  /**
   * Gets a reference to the underlying array. DO NOT create/dispose elements while iterating, or otherwise modify
   * the array.  If you need to modify the array, use getArrayCopy.
   * @returns {PhetioObject[]}
   * @public
   */
  getArray() {
    return this._array;
  }

  /**
   * Gets a copy of the underlying array. Use this method if you need to create/dispose elements while iterating,
   * or otherwise modify the group's array.
   * @returns {PhetioObject[]}
   * @public
   */
  getArrayCopy() {
    return this._array.slice();
  }

  /**
   * Returns the element at the specified index
   * @param {number} index
   * @returns {PhetioObject}
   * @public
   */
  getElement( index ) {
    return this._array[ index ];
  }

  /**
   * Gets the number of elements in the group.
   * @returns {number}
   * @public
   */
  get count() { return this.countProperty.value; }

  /**
   * Returns an array with elements that pass the filter predicate.
   * @param {function(PhetioObject)} predicate
   * @returns {Object[]}
   * @public
   */
  filter( predicate ) { return this._array.filter( predicate ); }

  /**
   * Does the group include the specified element?
   * @param {PhetioObject} element
   * @returns {boolean}
   * @public
   */
  includes( element ) { return this._array.includes( element ); }

  /**
   * Gets the index of the specified element in the underlying array.
   * @param {PhetioObject} element
   * @returns {number} - index, -1 if not found
   * @public
   */
  indexOf( element ) { return this._array.indexOf( element ); }

  /**
   * Runs the function on each element of the group.
   * @param {function(PhetioObject)} action - a function with a single parameter: the current element
   * @public
   */
  forEach( action ) { this._array.forEach( action ); }

  /**
   * Returns an array with every element mapped to a new one.
   * @param {function(PhetioObject)} f
   * @returns {Object[]}
   * @public
   */
  map( f ) { return this._array.map( f ); }

  /**
   * remove and dispose all registered group elements
   * @param {object} [options]
   * @public
   * @override
   */
  clear( options ) {
    options = merge( {

      // used for validation during state setting (phet-io internal), see PhetioDynamicElementContainer.disposeElement for documentation
      fromStateSetting: false,

      // whether the group's index is reset to 0 for the next element created
      resetIndex: true
    }, options );

    while ( this._array.length > 0 ) {
      this.disposeElement( this._array[ this._array.length - 1 ], options.fromStateSetting );
    }

    if ( options.resetIndex ) {
      this.groupElementIndex = 0;
    }
  }

  /**
   * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
   * so that electron_0 corresponds to electronNode_0 and so on.
   * @param {string} tandemName - the tandem name of the model element
   * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type
   *                                      `stateToArgsForConstructor` method
   * @returns {PhetioObject}
   * @public
   */
  createCorrespondingGroupElement( tandemName, ...argsForCreateFunction ) {
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
   * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type
   *                                      `stateToArgsForConstructor` method
   * @returns {PhetioObject}
   * @public
   */
  createNextElement( ...argsForCreateFunction ) {
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
   * @param {number} index - the number of the individual element
   * @param {Array.<*>} argsForCreateFunction
   * @param {boolean} [fromStateSetting] - Used for validation during state setting. See PhetioDynamicElementContainer.disposeElement() for documentation
   * @returns {PhetioObject}
   * @public (PhetioGroupIO)
   */
  createIndexedElement( index, argsForCreateFunction, fromStateSetting ) {
    assert && Tandem.VALIDATION && assert( this.isPhetioInstrumented(), 'TODO: support uninstrumented PhetioGroups? see https://github.com/phetsims/tandem/issues/184' );

    assert && this.supportsDynamicState && _.hasIn( window, 'phet.joist.sim.' ) &&
    phet.joist.sim.isSettingPhetioStateProperty.value && assert( fromStateSetting,
      'dynamic elements should only be created by the state engine when setting state.' );

    const componentName = this.phetioDynamicElementName + window.phetio.PhetioIDUtils.GROUP_SEPARATOR + index;
    const containerParameterType = this.phetioType.parameterTypes[ 0 ];
    const groupElement = this.createDynamicElement( componentName, argsForCreateFunction, containerParameterType );

    this._array.push( groupElement );

    this.countProperty.value = this._array.length;

    this.notifyElementCreated( groupElement );

    return groupElement;
  }
}

tandemNamespace.register( 'PhetioGroup', PhetioGroup );
export default PhetioGroup;