// Copyright 2019-2020, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic elements may be created.  Checks that elements of the group
 * match the approved schema.
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

    // @public (read-only)
    this.array = [];

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
  disposeMember( element ) {
    arrayRemove( this.array, element );
    this.elementDisposedEmitter.emit( element );
    element.dispose();
  }

  /**
   * Returns the element at the specified index
   * @param {number} index
   * @returns {Object}
   */
  get( index ) {
    return this.array[ index ];
  }

  /**
   * Get number of Group elements
   * @returns {number}
   * @public
   */
  get length() { return this.array.length; }

  /**
   * Returns an array with elements that pass the filter predicate.
   * @param {function(PhetioObject)} predicate
   * @returns {Object[]}
   * @public
   */
  filter( predicate ) { return this.array.filter( predicate ); }

  /**
   * Returns true if the group contains the specified object.
   * @param {Object} element
   * @returns {boolean}
   * @public
   */
  contains( element ) { return this.array.indexOf( element ) >= 0; }

  /**
   * Runs the function on each element of the group.
   * @param {function(PhetioObject)} action - a function with a single parameter: the current element
   * @public
   */
  forEach( action ) { this.array.forEach( action ); }

  /**
   * Returns an array with every element mapped to a new one.
   * @param {function(PhetioObject)} f
   * @returns {Object[]}
   * @public
   */
  map( f ) { return this.array.map( f ); }

  /**
   * remove and dispose all registered group elements
   * @public
   */
  clear() {
    while ( this.array.length > 0 ) {
      this.disposeMember( this.array[ this.array.length - 1 ] );
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
  createCorrespondingGroupMember( phetioObject, ...argsForCreateFunction ) {
    const index = window.phetio.PhetioIDUtils.getGroupMemberIndex( phetioObject.tandem.name );

    // If the specified index overlapped with the next available index, bump it up so there is no collision on the
    // next createNextMember
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
  createNextMember( ...argsForCreateFunction ) {
    return this.createIndexedElement( this.groupElementIndex++, argsForCreateFunction );
  }

  /**
   * Primarily for internal use, clients should usually use createNextMember.
   * @param {number} index - the number of the individual element
   * @param {Array.<*>} argsForCreateFunction
   * @returns {Object}
   * @public (PhetioGroupIO)
   */
  createIndexedElement( index, argsForCreateFunction ) {

    const componentName = this.phetioDynamicElementName + window.phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

    const groupElement = this.createDynamicElement( componentName,
      argsForCreateFunction, this.phetioType.parameterTypes[ 0 ] );

    this.array.push( groupElement );
    this.elementCreatedEmitter.emit( groupElement );

    return groupElement;
  }
}

tandemNamespace.register( 'PhetioGroup', PhetioGroup );
export default PhetioGroup;