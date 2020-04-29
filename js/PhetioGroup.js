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

import Emitter from '../../axon/js/Emitter.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import PhetioDynamicElementContainer from './PhetioDynamicElementContainer.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Group';

class PhetioGroup extends PhetioDynamicElementContainer {

  /**
   * @param {function} createElement - function that creates a dynamic element for the group.
   * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
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

    // @private {PhetioObject[]} access using getArray or getArrayCopy
    this._array = [];

    // @public (read-only)
    // TODO: why validate with stub true? Also is it worth using TinyEmitter? https://github.com/phetsims/tandem/issues/170
    this.elementCreatedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );
    this.elementDisposedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );

    // @public (only for PhetioGroupIO) - for generating indices from a pool
    this.groupElementIndex = 0;

    // Emit to the data stream on element creation/disposal
    this.elementCreatedEmitter.addListener( element => this.createdEventListener( element ) );
    this.elementDisposedEmitter.addListener( element => this.disposedEventListener( element ) );
  }

  /**
   * @public
   */
  dispose() {
    assert && assert( false, 'PhetioGroup not intended for disposal' );
  }

  /**
   * Remove an element from this Group, unregistering it from PhET-iO and disposing it.
   * @param element
   * @public
   */
  disposeElement( element ) {
    arrayRemove( this._array, element );
    this.elementDisposedEmitter.emit( element );
    element.dispose();
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
   * Get number of Group elements
   * @returns {number}
   * @public
   */
  get length() { return this._array.length; }

  /**
   * Returns an array with elements that pass the filter predicate.
   * @param {function(PhetioObject)} predicate
   * @returns {Object[]}
   * @public
   */
  filter( predicate ) { return this._array.filter( predicate ); }

  /**
   * Returns true if the group contains the specified object.
   * @param {PhetioObject} element
   * @returns {boolean}
   * @public
   */
  contains( element ) { return this._array.indexOf( element ) >= 0; }

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
   * @public
   */
  clear() {
    while ( this._array.length > 0 ) {
      this.disposeElement( this._array[ this._array.length - 1 ] );
    }

    this.groupElementIndex = 0;
  }

  /**
   * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
   * so that electron_0 corresponds to electronNode_0 and so on.
   * @param {PhetioObject} phetioObject
   * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgsForConstructor` method
   * @returns {PhetioObject}
   * @public
   */
  createCorrespondingGroupElement( phetioObject, ...argsForCreateFunction ) {
    const index = window.phetio.PhetioIDUtils.getGroupElementIndex( phetioObject.tandem.name );

    // If the specified index overlapped with the next available index, bump it up so there is no collision on the
    // next createNextElement
    if ( this.groupElementIndex === index ) {
      this.groupElementIndex++;
    }
    return this.createIndexedElement( index, argsForCreateFunction );
  }

  /**
   * Creates the next group element.
   * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgsForConstructor` method
   * @returns {PhetioObject}
   * @public
   */
  createNextElement( ...argsForCreateFunction ) {
    return this.createIndexedElement( this.groupElementIndex++, argsForCreateFunction );
  }

  /**
   * Primarily for internal use, clients should usually use createNextElement.
   * @param {number} index - the number of the individual element
   * @param {Array.<*>} argsForCreateFunction
   * @returns {PhetioObject}
   * @public (PhetioGroupIO)
   */
  createIndexedElement( index, argsForCreateFunction ) {

    const componentName = this.phetioDynamicElementName + window.phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

    const groupElement = this.createDynamicElement( componentName,
      argsForCreateFunction, this.phetioType.parameterTypes[ 0 ] );

    this._array.push( groupElement );
    this.elementCreatedEmitter.emit( groupElement );

    return groupElement;
  }
}

tandemNamespace.register( 'PhetioGroup', PhetioGroup );
export default PhetioGroup;