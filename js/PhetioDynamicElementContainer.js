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

import Emitter from '../../axon/js/Emitter.js';
import validate from '../../axon/js/validate.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
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
      // when beginning to set PhET-iO state. Furthermore, view elements following the "only the models are stateful"
      // pattern must mark this as false, otherwise the state engine will try to create these elements instead of letting
      // the model notifications handle this.
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

    // @public (read-only) - subtypes expected to fire this according to indivual implementations
    this.elementCreatedEmitter = new Emitter( { parameters: [ { valueType: PhetioObject } ] } );

    // @public (read-only) - called on disposal of an element
    this.elementDisposedEmitter = new Emitter( { parameters: [ { valueType: PhetioObject } ] } );

    // Emit to the data stream on element creation/disposal
    this.elementCreatedEmitter.addListener( element => this.createdEventListener( element ) );
    this.elementDisposedEmitter.addListener( element => this.disposedEventListener( element ) );

    // @private {boolean} - a way to delay creation notifications to a later time, for phet-io state engine support
    this.notificationsDeferred = false;

    // @private {PhetioObject} - lists to keep track of the created and disposed elements when notifications are deferred.
    // These are used to then flush notifications when they are set to no longer be deferred.
    this.deferredCreations = [];
    this.deferredDisposals = [];

    if ( Tandem.PHET_IO_ENABLED && this.supportsDynamicState ) {
      const phetioStateEngine = phet.phetio.phetioEngine.phetioStateEngine;

      // On state start, clear out the container and set to defer notifications.
      phetioStateEngine.onBeforeStateSet.addListener( phetioIDsToSet => {
        for ( let i = 0; i < phetioIDsToSet.length; i++ ) {
          const phetioID = phetioIDsToSet[ i ];
          if ( _.startsWith( phetioID, this.tandem.phetioID ) ) {
            this.clear();
            this.setNotificationsDeferred( true );
            return;
          }
        }
      } );

      // done with state setting
      phetioStateEngine.stateSetEmitter.addListener( () => {
        if ( this.notificationsDeferred ) {
          this.setNotificationsDeferred( false );
        }
      } );

      phetioStateEngine.addStateProcessor( ( state, completedIDs ) => {
        let creationNotified = false;

        while ( this.deferredCreations.length > 0 ) {
          const deferredCreatedElement = this.deferredCreations[ 0 ];
          if ( this.allChildrenSetForState( state, completedIDs ) ) {
            this.notifyElementCreatedWhileDeferred( deferredCreatedElement );
            creationNotified = true;
          }
        }
        return creationNotified;
      } );
    }
  }

  /**
   * @param {Object.<phetioID:string, *>} state
   * @param {string[]} completedIDs - list of ids that have already had their state set
   * @returns {boolean} - true if all children of this container (based on phetioID) have had their state set already.
   */
  allChildrenSetForState( state, completedIDs ) {
    const allIDsToSet = Object.keys( state );
    for ( let i = 0; i < allIDsToSet.length; i++ ) {
      const phetioID = allIDsToSet[ i ];
      if ( _.startsWith( phetioID, this.tandem.phetioID ) && !completedIDs.indexOf( phetioID ) ) {
        return false;
      }
    }
    return true; // No elements in state that aren't in the completed list
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
    // TODO: why do we get this information from phetioAPIValidation? Does recent API file work change this? https://github.com/phetsims/phet-io/issues/1648
    if ( phetioAPIValidation.simHasStarted ) {
      return null;
    }

    // When generating the baseline, output the schema for the archetype
    if ( Tandem.PHET_IO_ENABLED && phet.preloads.phetio.createArchetypes ) {
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

    let createdObjectTandem;
    if ( !this.tandem.hasChild( componentName ) ) {
      createdObjectTandem = new DynamicTandem( this.tandem, componentName, this.tandem.getExtendedOptions() );
    }
    else {
      createdObjectTandem = this.tandem.createTandem( componentName, this.tandem.getExtendedOptions() );
      assert && assert( createdObjectTandem instanceof DynamicTandem, 'createdObjectTandem should be an instance of DynamicTandem' );
    }

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

  /**
   * @public
   */
  dispose() {

    // If hitting this assertion because of nested dynamic element containers, please discuss with a phet-io team member.
    assert && assert( false, 'PhetioDynamicElementContainers are not intended for disposal' );
  }

  /**
   * Dispose a contained element
   * @param {PhetioObject} element
   * @protected - should not be called directly for PhetioGroup or PhetioCapsule, but can be made public if other subtypes need to.
   */
  disposeElement( element ) {
    element.dispose();

    if ( this.notificationsDeferred ) {
      this.deferredDisposals.push( element );
    }
    else {
      this.elementDisposedEmitter.emit( element );
    }
  }

  /**
   * @public
   * @abstract
   */
  clear() {
    throw new Error( 'clear() is abstract and should be implemented by subTypes' );
  }

  /**
   * Flush a single element from the list of deferred disposals that have not yet notified about the disposal. This
   * should never be called publicly, instead see `disposeElement`
   * @private
   * @param {PhetioObject} disposedElement
   */
  notifyElementDisposedWhileDeferred( disposedElement ) {
    assert && assert( this.notificationsDeferred, 'should only be called when notifications are deferred' );
    assert && assert( this.deferredDisposals.indexOf( disposedElement ) >= 0, 'disposedElement should not have been already notified' );
    this.elementDisposedEmitter.emit( disposedElement );
    arrayRemove( this.deferredDisposals, disposedElement );
  }

  /**
   * Should be called by subtypes upon element creation, see PhetioGroup as an example.
   * @protected
   * @param {PhetioObject} createdElement
   */
  notifyElementCreated( createdElement ) {
    if ( this.notificationsDeferred ) {
      this.deferredCreations.push( createdElement );
    }
    else {
      this.elementCreatedEmitter.emit( createdElement );
    }
  }

  /**
   * Flush a single element from the list of deferred creations that have not yet notified about the disposal. This
   * is only public to support specifc order dependencies in the PhetioStateEngine, otherwise see `this.notifyElementCreated()`
   * @public (PhetioGroupTests, phet-io) - only the PhetioStateEngine should notifiy individual elements created.
   * @param {PhetioObject} createdElement
   */
  notifyElementCreatedWhileDeferred( createdElement ) {
    assert && assert( this.notificationsDeferred, 'should only be called when notifications are deferred' );
    assert && assert( this.deferredCreations.indexOf( createdElement ) >= 0, 'createdElement should not have been already notified' );
    this.elementCreatedEmitter.emit( createdElement );
    arrayRemove( this.deferredCreations, createdElement );
  }

  /**
   * When set to true, creation and disposal notifications will be deferred until set to false. When set to false,
   * this function will flush all of the notifications for created and disposed elements (in that order) that occurred
   * while this container was deferring its notifications.
   * @public
   * @param {boolean} notificationsDeferred
   */
  setNotificationsDeferred( notificationsDeferred ) {
    assert && assert( notificationsDeferred !== this.notificationsDeferred, 'should not be the same as current value' );

    // Flush all notifications when setting to be no longer deferred
    if ( !notificationsDeferred ) {
      while ( this.deferredCreations.length > 0 ) {
        this.notifyElementCreatedWhileDeferred( this.deferredCreations[ 0 ] );
      }
      while ( this.deferredDisposals.length > 0 ) {
        this.notifyElementDisposedWhileDeferred( this.deferredDisposals[ 0 ] );
      }
    }
    assert && assert( this.deferredCreations.length === 0, 'creations should be clear' );
    assert && assert( this.deferredDisposals.length === 0, 'disposals should be clear' );
    this.notificationsDeferred = notificationsDeferred;
  }
}

tandemNamespace.register( 'PhetioDynamicElementContainer', PhetioDynamicElementContainer );
export default PhetioDynamicElementContainer;