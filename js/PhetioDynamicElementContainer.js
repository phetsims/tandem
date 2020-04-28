// Copyright 2019-2020, University of Colorado Boulder

/**
 * Supertype for containers that hold dynamic elements that are PhET-iO instrumented. This type handles common
 * features like creating the archetype for the PhET-iO api, and managing created/disposed data stream events.
 *
 * "Dynamic" is an overloaded term, so allow me to explain what it means in the context of this type. A "dynamic element"
 * is an instrumented PhET-iO element that is conditionally in the PhET-iO api. Most commonly this is because elements
 * can be created and destroyed during the runtime of the sim. Another "dynamic element" for the PhET-iO project is when
 * an element may or may not be created based on a query parameter. In this case, even if the object then exists for the
 * lifetime of the sim, we may still call this "dynamic" as it pertains to this type, and the PhET-iO api.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import validate from '../../axon/js/validate.js';
import merge from '../../phet-core/js/merge.js';
import DynamicTandem from './DynamicTandem.js';
import phetioAPIValidation from './phetioAPIValidation.js';
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

// constants
const DEFAULT_CONTAINER_SUFFIX = 'Container';

class PhetioDynamicElementContainer extends PhetioObject {

  /**
   * @param {function} createElement - function that creates a dynamic element to be housed in this container. All of
   * this dynamic element container's elements will be created from this function, including the archetype.
   * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
   * @param {Object} [options] - describe the Group itself
   */
  constructor( createElement, defaultArguments, options ) {

    options = merge( {
      phetioState: false, // elements are included in state, but the container will exist in the downstream sim.
      tandem: Tandem.REQUIRED,

      // By default, a PhetioDynamicElementContainer's elements are included in state such that on every setState call,
      // the elements are cleared out by the phetioStateEngine so elements in the state can be added to the empty group.
      // This option is for opting out of that behavior. When false, this container will not have its elements cleared
      // when beginning to set PhET-iO state. NOTE: Only use when it's guaranteed that all of the elements are
      // created on startup, and never at any point later during the sim's lifetime. When this is set to false, there
      // is no need for elements to support dynamic state. This may seem like a confusing option because you may be
      // thinking, "shouldn't all instances of PhetioDynamicElementContainer contain dynamic elements that are added
      // and removed throughout the lifetime of the sim?!?!" Please note the documentation above about the term "dynamic"
      // and note that this is an atypical option.
      supportsDynamicState: true,

      // {string} The container's tandem name must have this suffix, and the base tandem name for elements in
      // the container will consist of the group's tandem name with this suffix stripped off.
      containerSuffix: DEFAULT_CONTAINER_SUFFIX
    }, options );

    assert && assert( typeof createElement === 'function', 'createElement should be a function' );
    assert && assert( Array.isArray( defaultArguments ) || typeof defaultArguments === 'function', 'defaultArguments should be an array or a function' );
    if ( Array.isArray( defaultArguments ) ) {

      // createElement expects a Tandem as the first arg
      assert && assert( createElement.length === defaultArguments.length + 1, 'mismatched number of arguments' );
    }

    assert && assert( !!options.phetioType, 'phetioType must be supplied' );
    assert && assert( Array.isArray( options.phetioType.parameterTypes ), 'phetioType must supply its parameter types' );
    assert && assert( options.phetioType.parameterTypes.length === 1,
      'PhetioDynamicElementContainer\'s phetioType must have exactly one parameter type' );
    assert && assert( !!options.phetioType.parameterTypes[ 0 ],
      'PhetioDynamicElementContainer\'s phetioType\'s parameterType must be truthy' );
    assert && assert( options.tandem.name.endsWith( options.containerSuffix ),
      'PhetioDynamicElementContainer tandems should end with options.containerSuffix' );

    // options that depend on other options
    options = merge( {

      // {string} - tandem name for elements in the container is the container's tandem name without containerSuffix
      phetioDynamicElementName: options.tandem.name.slice( 0, options.tandem.name.length - options.containerSuffix.length )
    }, options );

    super( options );

    // @public (read-only phet-io internal) {boolean}
    this.supportsDynamicState = options.supportsDynamicState;

    // @protected {string}
    this.phetioDynamicElementName = options.phetioDynamicElementName;

    // @protected
    this.createElement = createElement;
    this.defaultArguments = defaultArguments;

    // @public (read-only) {PhetioObject|null} Can be used as an argument to create other archetypes, but otherwise
    // access should not be needed. This will only be non-null when generating the phet-io api, see createArchetype().
    this.archetype = this.createArchetype();
  }

  /**
   * @public
   */
  dispose() {
    assert && assert( false, 'PhetioDynamicElementContainers are not intended for disposal' );
  }


  /**
   * Archetypes are created to generate the baseline file, or to validate against an existing baseline file.  They are
   * PhetioObjects and registered with the phetioEngine, but not send out via notifications for phetioObjectAddedListeners,
   * because they are intended for internal usage only.  Archetypes should not be created in production code.
   * @returns {null|PhetioObject}
   * @private
   */
  createArchetype() {

    // Once the sim has started, any archetypes being created are likely done so because they are nested PhetioGroups.
    if ( phetioAPIValidation.simHasStarted ) {
      return null;
    }

    // When generating the baseline, output the schema for the archetype
    if ( ( Tandem.PHET_IO_ENABLED && phet.preloads.phetio.queryParameters.phetioPrintAPI ) ||
         ( Tandem.PHET_IO_ENABLED && phet.preloads.phetio.queryParameters.phetioCreateArchetypes ) ||
         phetioAPIValidation.enabled ) {
      const defaultArgs = Array.isArray( this.defaultArguments ) ? this.defaultArguments : this.defaultArguments();

      // The create function takes a tandem plus the default args
      assert && assert( this.createElement.length === defaultArgs.length + 1, 'mismatched number of arguments' );

      const archetype = this.createElement( this.tandem.createTandem( DynamicTandem.DYNAMIC_ARCHETYPE_NAME ), ...defaultArgs );

      // Mark the archetype for inclusion in the baseline schema
      archetype.markDynamicElementArchetype();
      return archetype;
    }
    else {
      return null;
    }
  }

  /**
   * Create a dynamic PhetioObject element for this container
   * @param {string} componentName
   * @param {Array.<*>} argsForCreateFunction
   * @param {function(new:ObjectIO)} containerParameterType
   * @returns {PhetioObject}
   * @public
   */
  createDynamicElement( componentName, argsForCreateFunction, containerParameterType ) {
    assert && assert( Array.isArray( argsForCreateFunction ), 'should be array' );

    // create with default state and substructure, details will need to be set by setter methods.
    const createdObjectTandem = new DynamicTandem( this.tandem, componentName, this.tandem.getExtendedOptions() );
    const createdObject = this.createElement( createdObjectTandem, ...argsForCreateFunction );

    // Make sure the new group element matches the schema for elements.
    validate( createdObject, containerParameterType.validator );

    assert && assert( createdObject.phetioType === containerParameterType,
      'dynamic element container expected its created instance\'s phetioType to match its parameterType.' );

    assert && this.assertDynamicPhetioObject( createdObject );

    return createdObject;
  }

  /**
   * A dynamic element should be an instrumented PhetioObject with phetioDynamicElement: true
   * @param {PhetioObject} phetioObject - object to be validated
   * @private
   */
  assertDynamicPhetioObject( phetioObject ) {
    if ( Tandem.PHET_IO_ENABLED ) {
      assert && assert( phetioObject instanceof PhetioObject, 'instance should be a PhetioObject' );
      assert && assert( phetioObject.isPhetioInstrumented(), 'instance should be instrumented' );
      assert && assert( phetioObject.phetioDynamicElement, 'instance should be marked as phetioDynamicElement:true' );
    }
  }

  /**
   * Emit a created or disposed event.
   * @param {PhetioObject} dynamicElement
   * @param {string} eventName
   * @param {Object} [additionalData] additional data for the event
   * @private
   */
  emitDataStreamEvent( dynamicElement, eventName, additionalData ) {
    this.phetioStartEvent( eventName, {
      data: merge( {
        phetioID: dynamicElement.tandem.phetioID
      }, additionalData )
    } );
    this.phetioEndEvent();
  }

  /**
   * Emit events when dynamic elements are created.
   * @param {PhetioObject} dynamicElement
   * @public
   */
  createdEventListener( dynamicElement ) {
    const additionalData = dynamicElement.phetioState ? {
      state: this.phetioType.parameterTypes[ 0 ].toStateObject( dynamicElement )
    } : null;
    this.emitDataStreamEvent( dynamicElement, 'created', additionalData );
  }

  /**
   * Emit events when dynamic elements are disposed.
   * @param {PhetioObject} dynamicElement
   * @public
   */
  disposedEventListener( dynamicElement ) {
    this.emitDataStreamEvent( dynamicElement, 'disposed' );
  }
}

tandemNamespace.register( 'PhetioDynamicElementContainer', PhetioDynamicElementContainer );
export default PhetioDynamicElementContainer;