// Copyright 2019-2020, University of Colorado Boulder

/**
 * A PhET-iO class that encapsulates a PhetioObject that is not created during sim startup to provide PhET-iO API
 * validation, API communication (like to view in studio before creation), and to support PhET-iO state if applicable.
 *
 * Constructing a PhetioCapsule creates a container encapsulating a wrapped element that can be of any type.
 *
 * Clients should use myCapsule.getElement() instead of storing the element value itself.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import PhetioDynamicElementContainer from './PhetioDynamicElementContainer.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Capsule';

class PhetioCapsule extends PhetioDynamicElementContainer {

  /**
   * @param {function(tandem, ...):PhetioObject} createElement - function that creates the encapsulated element
   * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments - arguments passed to createElement during API baseline generation
   * @param {Object} [options]
   */
  constructor( createElement, defaultArguments, options ) {

    options = merge( {
      tandem: Tandem.REQUIRED,

      // {string} The capsule's tandem name must have this suffix, and the base tandem name for its wrapped element
      // will consist of the capsule's tandem name with this suffix stripped off.
      containerSuffix: DEFAULT_CONTAINER_SUFFIX
    }, options );

    super( createElement, defaultArguments, options );

    // @public (read-only PhetioCapsuleIO) {PhetioObject}
    this.element = null;
  }

  /**
   * Dispose the underlying element.  Called by the PhetioStateEngine so the capsule element can be recreated with the
   * correct state.
   * @public (phet-io)
   * @override
   */
  disposeElement() {
    super.disposeElement( this.element );
    this.element = null;
  }

  /**
   * Creates the element if it has not been created yet, and returns it.
   * @param {Array.<*>} [argsForCreateFunction]
   * @returns {Object}
   * @public
   *
   */
  getElement( ...argsForCreateFunction ) {
    if ( !this.element ) {
      this.create( ...argsForCreateFunction );
    }
    return this.element;
  }

  /**
   * Primarily for internal use, clients should usually use getInstance.
   * @param {Array.<*>} [argsForCreateFunction]
   * @returns {Object}
   * @public (phet-io)
   */
  create( ...argsForCreateFunction ) {

    // create with default state and substructure, details will need to be set by setter methods.
    this.element = this.createDynamicElement(
      this.phetioDynamicElementName,
      argsForCreateFunction,
      this.phetioType.parameterTypes[ 0 ]
    );

    this.elementCreatedEmitter.emit( this.element );

    return this.element;
  }
}

tandemNamespace.register( 'PhetioCapsule', PhetioCapsule );
export default PhetioCapsule;