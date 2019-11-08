// Copyright 2017-2019, University of Colorado Boulder

/**
 * Base type that provides PhET-iO features. An instrumented PhetioObject is referred to on the wrapper side/design side
 * as a "PhET-iO element".  Note that sims may have hundreds or thousands of PhetioObjects, so performance and memory
 * considerations are important.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const EventType = require( 'TANDEM/EventType' );
  const inherit = require( 'PHET_CORE/inherit' );
  const LinkedElementIO = require( 'TANDEM/LinkedElementIO' );
  const merge = require( 'PHET_CORE/merge' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // ifphetio
  const dataStream = require( 'ifphetio!PHET_IO/dataStream' );

  // constants
  const PHET_IO_ENABLED = Tandem.PHET_IO_ENABLED;

  // Indicates a high frequency message was skipped.
  const SKIPPING_HIGH_FREQUENCY_MESSAGE = -1;

  // Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
  const EMPTY_OBJECT = {};

  const DEFAULTS = {
    tandem: Tandem.optional,          // Subtypes can use `Tandem.tandemRequired` to require a named tandem passed in
    phetioType: ObjectIO,             // Defines API methods, events and serialization
    phetioDocumentation: '',          // Useful notes about an instrumented PhetioObject, shown in the PhET-iO Studio Wrapper
    phetioState: true,                // When true, includes the PhetioObject in the PhET-iO state (not automatically recursive, may require phetioComponentOptions for Nodes or other types)
    phetioReadOnly: false,            // When true, you can only get values from the PhetioObject; no setting allowed.
    phetioEventType: EventType.MODEL, // Category of event type, can be overridden in phetioStartEvent options
    phetioHighFrequency: false,       // High frequency events such as mouse moves can be omitted from data stream, see ?phetioEmitHighFrequencyEvents and Client.launchSim option
    phetioPlayback: false,            // When true, emits events for data streams for playback, see handlePlaybackEvent.js
    phetioStudioControl: true,        // When true, Studio is allowed to create a control for this PhetioObject (if it knows how)
    phetioComponentOptions: null,     // For propagating phetio options to sub-components, see SUPPORTED_PHET_IO_COMPONENT_OPTIONS
    phetioFeatured: false,            // When true, this is categorized as an important "featured" element in Studio.
    phetioEventMetadata: null,        // {Object} optional - delivered with each event, if specified. phetioPlayback is appended here, if true
    phetioDynamicElement: false,      // {boolean} optional - indicates that an object may or may not have been created, applies recursively automatically. Dynamic prototypes will have this overwritten to false, even if provided as true as prototypes cannot be dynamic.

    // TODO: this is used very rarely, perhaps we should make a sparse map of this directly on phetioEngine instead?
    phetioDynamicElementPrototype: false  // {boolean} optional - indicates that an object is a prototype for a dynamic class. Settable by classes that create dynamic elements when creating their prototypes (like PhetioGroup), see PhetioObject.markDynamicElementPrototype()
  };

  // phetioComponentOptions can specify either (a) the name of the specific subcomponent to target or (b) use a key from
  // DEFAULTS to apply to all subcomponents
  const SUPPORTED_PHET_IO_COMPONENT_OPTIONS = _.keys( DEFAULTS ).concat( [

    // NodeIO
    'visibleProperty', 'pickableProperty', 'opacityProperty',

    // TextIO
    'textProperty'
  ] );

  const OPTIONS_KEYS = _.keys( DEFAULTS );

  // factor these out so that we don't recreate closures for each instance.
  const isDynamicElementPredicate = phetioObject => phetioObject.phetioDynamicElement;
  const isDynamicElementPrototypePredicate = phetioObject => phetioObject.phetioDynamicElementPrototype;

  /**
   * @param {Object} [options]
   * @constructor
   */
  function PhetioObject( options ) {

    // @public (read-only) {Tandem} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
    this.tandem = null;

    // @public (read-only) {IOType} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
    this.phetioType = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
    this.phetioState = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
    this.phetioReadOnly = null;

    // @public (read-only) {string} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
    this.phetioDocumentation = null;

    // @public (read-only) {ObjectIO} - assigned in initializePhetioObject - the instantiated IO type. The phetioWrapper
    // is the API layer between the wrapper and the phetioObject. It's used to call methods on this phetioObject from
    // the wrapper frame.
    this.phetioWrapper = null;

    // @private {boolean} - track whether the object has been initialized.  This is necessary because initialization
    // can happen in the constructor or in a subsequent call to initializePhetioObject (to support scenery Node)
    this.phetioObjectInitialized = false;

    // @private {number|null} - tracks the indices of started messages so that dataStream can check that ends match starts
    this.phetioMessageStack = [];

    // @public (read-only) {boolean} - has it been disposed?
    this.isDisposed = false;

    // @private {EventType} - see docs at DEFAULTS declaration
    this.phetioEventType = null;

    // @private {boolean} - see docs at DEFAULTS declaration
    this.phetioHighFrequency = null;

    // @private {boolean} - see docs at DEFAULTS declaration
    this.phetioPlayback = null;

    // @private {boolean} - see docs at DEFAULTS declaration
    this.phetioStudioControl = null;

    // @private {boolean} - see docs at DEFAULTS declaration
    this._phetioDynamicElement = null;

    // @private {boolean} - see docs at DEFAULTS declaration
    this.phetioDynamicElementPrototype = null;

    // @private {boolean} - see docs at DEFAULTS declaration // TODO: are these really private?
    this.phetioFeatured = false;

    // @private {Object|null}
    this.phetioEventMetadata = null;

    // @public {Object} - see docs at DEFAULTS declaration
    this.phetioComponentOptions = null;

    // @public (phetioEngine) {Object|null} - only non null with phetio.queryParameters.phetioPrintPhetioFiles enabled
    this.phetioBaselineMetadata = null;

    // @private {LinkedElement[]} - keep track of LinkedElements for disposal
    this.linkedElements = [];

    if ( options ) {
      this.initializePhetioObject( {}, options );
    }

    if ( assert ) {

      // Wrap the prototype dispose method with a check. NOTE: We will not catch devious cases where the dispose() is
      // overridden after the Node constructor (which may happen).
      const protoDispose = this.dispose;
      this.dispose = () => {
        assert && assert( !this.isDisposed, 'This PhetioObject has already been disposed, and cannot be disposed again' );
        protoDispose.call( this );
        assert && assert( this.isDisposed, 'PhetioObject.dispose() call is missing from an overridden dispose method' );
      };
    }
  }

  tandemNamespace.register( 'PhetioObject', PhetioObject );

  /**
   * Determine if any of the options keys are intended for PhetioObject. Semantically equivalent to
   * _.intersection( _.keys( options ), OPTIONS_KEYS ).length>0 but implemented imperatively to avoid memory or
   * performance issues.
   * @param {Object} options
   * @returns {boolean}
   */
  const specifiesPhetioObjectKey = options => {
    for ( const key in options ) {
      if ( options.hasOwnProperty( key ) ) {
        if ( OPTIONS_KEYS.indexOf( key ) >= 0 ) {
          return true;
        }
      }
    }
    return false;
  };

  // Since PhetioObject is extended with inherit (e.g., SCENERY/Node), this cannot be an ES6 class
  inherit( Object, PhetioObject, {

    /**
     * Like SCENERY/Node, PhetioObject can be configured during construction or later with a mutate call.
     *
     * @param {Object} baseOptions - only applied if options keys intersect OPTIONS_KEYS
     * @param {Object} options
     * @protected
     */
    initializePhetioObject: function( baseOptions, options ) {
      assert && assert( options, 'initializePhetioObject must be called with options' );

      // No PhetioObject options were provided. If not yet initialized, perhaps they will be provided in a subsequent
      // Node.mutate() call.
      if ( !specifiesPhetioObjectKey( options ) ) {
        return;
      }

      // assert this after the `specifiesPhetioObjectKey check to support something like:
      // `new Node( {tandem: tandem}).mutate({})`
      assert && assert( !this.phetioObjectInitialized, 'cannot initialize twice' );

      assert && assert( options.tandem, 'Component was missing its tandem' );

      const phetioID = options.tandem.phetioID;
      assert && assert( phetioID, 'Component was missing its phetioID' );

      if ( assert && options.phetioType && PHET_IO_ENABLED ) {
        assert && assert( options.phetioType.documentation, 'There must be a documentation string for each IO Type.' );

        for ( const methodName in options.phetioType.methods ) {
          if ( options.phetioType.methods.hasOwnProperty( methodName ) ) {
            const method = options.phetioType.methods[ methodName ];

            if ( typeof method === 'function' ) {

              // This is a private function for internal phet-io mechanics, not for exporting over the API, so it doesn't
              // need to be checked.
            }
            else {
              const IOType = options.phetioType;

              // If you get one of these assertion errors, go to the IOType definition file and check its methods
              assert && assert( !!method.returnType, IOType.typeName + '.' + methodName + ' needs a returnType' );
              assert && assert( !!method.implementation, IOType.typeName + '.' + methodName + ' needs an implementation function' );
              assert && assert( !!method.parameterTypes, IOType.typeName + '.' + methodName + ' needs a parameterTypes array' );
              assert && assert( !!method.documentation, IOType.typeName + '.' + methodName + ' needs a documentation string' );
            }
          }
        }

        assert && assert( options.phetioType !== undefined, phetioID + ' missing type from phetio.api' );
        assert && assert( options.phetioType.typeName, 'no type name for ' + phetioID + '(may be missing type parameter)' );
        assert && assert( options.phetioType.typeName, 'type must be specified and have a typeName for ' + phetioID );
      }

      options = merge( {}, DEFAULTS, baseOptions, options );

      assert && assert( typeof options.phetioDocumentation === 'string',
        'invalid phetioDocumentation: ' + options.phetioDocumentation
      );
      assert && assert( options.phetioDocumentation.indexOf( '\n' ) === -1, 'use "<br>" instead of newlines' );

      // This block is associated with validating the baseline api and filling in metadata specified in the elements
      // overrides API file. Even when validation is not enabled, overrides should still be applied.
      if ( PHET_IO_ENABLED && options.tandem.supplied ) {

        // Store the full baseline if we are printing out those files or need it for validation. Do this before
        // applying overrides.
        if ( phet.phetio.queryParameters.phetioPrintPhetioFiles || phetioAPIValidation.enabled ) {
          this.phetioBaselineMetadata = PhetioObject.getMetadata( options );
        }

        // If not a deprecated dynamic element
        // TODO: Remove '~' check once TANDEM/Tandem.GroupTandem usages have been replaced, see https://github.com/phetsims/tandem/issues/87 and https://github.com/phetsims/phet-io/issues/1409
        if ( phetioID.indexOf( '~' ) === -1 ) {

          // Dynamic elements should compare to their "concrete" counterparts.
          const concretePhetioID = options.tandem.getConcretePhetioID();

          // Overrides are only defined for simulations, not for unit tests.  See https://github.com/phetsims/phet-io/issues/1461
          // Patch in the desired values from overrides, if any.
          if ( window.phet.phetio.phetioElementsOverrides ) {
            const overrides = window.phet.phetio.phetioElementsOverrides[ concretePhetioID ];
            if ( overrides ) {

              // No need to make a new object, since this "options" variable was created in the previous extend call above.
              options = merge( options, overrides );
            }
          }
        }
      }

      // Unpack options to properties
      this.tandem = options.tandem;
      this.phetioType = options.phetioType;
      this.phetioState = options.phetioState;
      this.phetioReadOnly = options.phetioReadOnly;
      this.phetioEventType = options.phetioEventType;
      this.phetioDocumentation = options.phetioDocumentation;
      this.phetioHighFrequency = options.phetioHighFrequency;
      this.phetioPlayback = options.phetioPlayback;
      this.phetioStudioControl = options.phetioStudioControl;
      this.phetioComponentOptions = options.phetioComponentOptions || EMPTY_OBJECT;
      this.phetioFeatured = options.phetioFeatured;
      this.phetioEventMetadata = options.phetioEventMetadata;
      this.phetioDynamicElement = options.phetioDynamicElement ||

                                  // Support phet brand, and phetioEngine doesn't yet exist while registering
                                  // engine-related objects (including phetioEngine itself). This is okay though, as
                                  // none of these should be marked as dynamic.
                                  !!( _.hasIn( window, 'phet.phetIo.phetioEngine' ) &&
                                      phet.phetIo.phetioEngine.ancestorMatches( this.tandem.phetioID, isDynamicElementPredicate ) );

      // Support phet brand, and phetioEngine doesn't yet exist while registering engine-related objects (including
      // phetioEngine itself). This is okay though, as none of these should be marked as dynamic.
      this.phetioDynamicElementPrototype = !!( _.hasIn( window, 'phet.phetIo.phetioEngine' ) &&
                                               phet.phetIo.phetioEngine.ancestorMatches( this.tandem.phetioID, isDynamicElementPrototypePredicate ) );

      // Patch this in after we have determined if parents are dynamic elements as well.
      if ( this.phetioBaselineMetadata ) {
        this.phetioBaselineMetadata.phetioDynamicElement = this._phetioDynamicElement;
      }

      // Make sure playback shows in the phetioEventMetadata
      if ( this.phetioPlayback ) {
        this.phetioEventMetadata = this.phetioEventMetadata || {};
        assert && assert( !this.phetioEventMetadata.hasOwnProperty( 'playback' ), 'phetioEventMetadata.playback should not already exist' );
        this.phetioEventMetadata.playback = true;
      }

      // validate phetioComponentOptions
      assert && _.keys( this.phetioComponentOptions ).forEach( option => {
        assert && assert( SUPPORTED_PHET_IO_COMPONENT_OPTIONS.indexOf( option ) >= 0, 'Unsupported phetioComponentOptions: ' + option );
      } );

      // Instantiate the wrapper instance which is used for PhET-iO communication
      if ( this.isPhetioInstrumented() ) {
        // this assertion should be enabled for new phet-io sim publications
        // TODO: are we really going to add phetioDocumentation to every PhetioObject?, see https://github.com/phetsims/phet-io/issues/1409
        // TODO: If so, this assertion should be elsewhere, see https://github.com/phetsims/phet-io/issues/1409
        // assert && assert( this.phetioDocumentation, 'phetioDocumentation is required for: ' + this.tandem.phetioID );

        // @public (read-only phet-io-internal)
        this.phetioWrapper = new this.phetioType( this, this.tandem.phetioID );

        // Any children that have been created thus far should be now marked as phetioDynamicElement.
        // Get this value from options because this only needs to be done on the root dynamic element
        options.phetioDynamicElement && this.propagateDynamicFlagsToChildren();
      }
      this.tandem.addPhetioObject( this );
      this.phetioObjectInitialized = true;
    },

    /**
     * Start an event for the nested PhET-iO data stream.
     *
     * @param {string} event - the name of the event
     * @param {Object|function|null} [data] - data for the event, either an object, or a function that returns an object
     *                                      - this is transmitted over postMessage using the structured cloning algorithm
     *                                      - and hence cannot contain functions or other unclonable elements
     *                                      - TODO: We have recently been considering overloading to be an antipattern, maybe this should be split up
     * @public
     */
    phetioStartEvent: function( event, data ) {
      assert && assert( this.phetioObjectInitialized, 'phetioObject should be initialized' );
      assert && assert( typeof event === 'string' );
      assert && data && assert( typeof data === 'object' || typeof data === 'function' );
      assert && assert( arguments.length === 1 || arguments.length === 2, 'Prevent usage of incorrect signature' );

      // Opt out of certain events if queryParameter override is provided
      if ( _.hasIn( window, 'phet.phetio.queryParameters' ) &&
           !window.phet.phetio.queryParameters.phetioEmitHighFrequencyEvents && this.phetioHighFrequency ) {
        this.phetioMessageStack.push( SKIPPING_HIGH_FREQUENCY_MESSAGE );
        return;
      }

      if ( this.isPhetioInstrumented() ) {

        // Only get the args if we are actually going to send the event.
        if ( typeof data === 'function' ) {
          data = data();
        }

        this.phetioMessageStack.push( dataStream.start( this.phetioEventType, this, event, data, this.phetioEventMetadata ) );
      }
    },

    /**
     * End an event on the nested PhET-iO data stream. It this object was disposed or dataStream.start was not called,
     * this is a no-op.
     * @public
     */
    phetioEndEvent: function() {

      const topMessageIndex = this.phetioMessageStack.pop();

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if ( topMessageIndex === SKIPPING_HIGH_FREQUENCY_MESSAGE ) {
        return;
      }

      if ( this.isPhetioInstrumented() ) {
        dataStream.end( topMessageIndex );
      }
    },

    /**
     * Set any instrumented children of this PhetioObject to the same value as this.phetioDynamicElement.
     * @private
     */
    propagateDynamicFlagsToChildren: function() {
      assert && assert( _.hasIn( window, 'phet.phetIo.phetioEngine' ), 'phetioEngine should be defined' );
      const children = phet.phetIo.phetioEngine.getChildren( this );

      for ( let i = 0; i < children.length; i++ ) {
        const child = children[ i ];

        // Order matters here! The phetioDynamicElementPrototype needs to be first to ensure that the phetioDynamicElement
        // setter can opt out for prototypes.
        child.phetioDynamicElementPrototype = this.phetioDynamicElementPrototype;
        child.phetioDynamicElement = this._phetioDynamicElement;

        if ( child.phetioBaselineMetadata ) {
          child.phetioBaselineMetadata.phetioDynamicElementPrototype = this.phetioDynamicElementPrototype;
        }
      }
    },

    /**
     * Should not be set outside of this file!
     * @private
     * @param {boolean} phetioDynamicElement
     */
    set phetioDynamicElement( phetioDynamicElement ) {

      //If this element is a prototype, it is not a dynamic element.
      if ( this.phetioDynamicElementPrototype ) {
        this._phetioDynamicElement = false;
      }
      else {
        this._phetioDynamicElement = phetioDynamicElement;
      }

      // keep baseline metadata in sync too
      if ( this.phetioBaselineMetadata ) {
        this.phetioBaselineMetadata.phetioDynamicElement = this._phetioDynamicElement;
      }
    },

    /**
     * @public
     * @returns {boolean}
     */
    get phetioDynamicElement() {
      return this._phetioDynamicElement;
    },

    /**
     * Mark this PhetioObject as a prototype for a dynamic element.
     */
    markDynamicElementPrototype: function() {
      this.phetioDynamicElementPrototype = true;
      this.phetioDynamicElement = false; // because prototypes aren't dynamic elements

      if ( this.phetioBaselineMetadata ) {
        this.phetioBaselineMetadata.phetioDynamicElementPrototype = this.phetioDynamicElementPrototype;
      }

      // recompute for children also, but only if phet-io is enabled
      Tandem.PHET_IO_ENABLED && this.propagateDynamicFlagsToChildren();
    },

    /**
     * Just because a tandem is passed in doesn't mean that it is instrumented. A PhetioObject will only be instrumented
     * if:
     * (1) Running in PhET-iO mode
     * (2) The tandem that was passed in was "supplied". See Tandem.supplied for more info
     * @returns {boolean}
     * @public
     */
    isPhetioInstrumented: function() {
      return this.tandem && this.tandem.supplied && PHET_IO_ENABLED;
    },

    /**
     * This creates a one-way association between this PhetioObject and the specified element, which is rendered in
     * Studio as a "symbolic" link or hyperlink.
     * @param {PhetioObject} element - the target element.
     * @param {Object} [options]
     */
    addLinkedElement: function( element, options ) {
      assert && assert( element instanceof PhetioObject, 'element must be of type PhetioObject' );
      assert && assert( this.phetioObjectInitialized,
        'cannot add linked element to an item that hasn\'t called PhetioObject.initializePhetioObject, (make sure to ' +
        'call this after mutate).' );

      if ( this.isPhetioInstrumented() ) {
        this.linkedElements.push( new LinkedElement( element, options ) );
      }
    },

    /**
     * Performs cleanup after the sim's construction has finished.
     *
     * @public
     */
    onSimulationConstructionCompleted: function() {

      // deletes the phetioBaselineMetadata, as it's no longer needed since validation is complete.
      this.phetioBaselineMetadata = null;
    },

    /**
     * Remove this phetioObject from PhET-iO. After disposal, this object is no longer interoperable. Also release any
     * other references created during its lifetime.
     * @public
     */
    dispose: function() {
      const self = this;
      assert && assert( !this.isDisposed, 'PhetioObject can only be disposed once' );

      // In order to support the structured data stream, PhetioObjects must end the messages in the correct
      // sequence, without being interrupted by dispose() calls.  Therefore, we do not clear out any of the state
      // related to the endEvent.  Note this means it is acceptable (and expected) for endEvent() to be called on
      // disposed PhetioObjects.
      //
      // The phetioEvent stack should resolve by the next clock tick, so that's when we check it.
      assert && setTimeout( () => { // eslint-disable-line bad-sim-text
        assert && assert( self.phetioMessageStack.length === 0, 'phetioMessageStack should be clear' );
      }, 0 );

      if ( this.phetioObjectInitialized ) {
        this.tandem.removePhetioObject( this );
        this.phetioWrapper && this.phetioWrapper.dispose && this.phetioWrapper.dispose();
      }

      // Dispose LinkedElements
      this.linkedElements.forEach( linkedElement => linkedElement.dispose() );
      this.linkedElements.length = 0;

      this.isDisposed = true;
    }
  }, {

    /**
     * Convenience function which assigns phetioComponentOptions based on a merge, and performs basic sanity checks.
     * @public
     * @param {Object} defaults
     * @param {Object} options - mutated to included merged phetioComponentOptions
     */
    mergePhetioComponentOptions: function( defaults, options ) {
      if ( assert && options.phetioComponentOptions ) {
        assert( options.phetioComponentOptions instanceof Object );
        assert( !options.phetioComponentOptions.tandem, 'tandem not supported in phetioComponentOptions' );
        assert( !options.phetioComponentOptions.phetioType, 'phetioType not supported in phetioComponentOptions' );
        assert( !options.phetioComponentOptions.phetioEventType, 'phetioEventType not supported in phetioComponentOptions' );
      }

      // This uses lodash merge instead of PHET_CORE/merge because it merges recursively on all keys, not just *Options keys
      options.phetioComponentOptions = _.merge( defaults, options.phetioComponentOptions );
    },

    /**
     * JSONifiable metadata that describes the nature of the PhetioObject.  We must be able to read this
     * for baseline (before object fully constructed we use object) and after fully constructed
     * which includes overrides.
     * @param {Object} object - used to get metadata keys
     * @returns {Object}
     * @public
     */
    getMetadata: function( object ) {
      return {
        phetioTypeName: object.phetioType.typeName,
        phetioDocumentation: object.phetioDocumentation,
        phetioState: object.phetioState,
        phetioReadOnly: object.phetioReadOnly,
        phetioEventType: EventType.phetioType.toStateObject( object.phetioEventType ),
        phetioHighFrequency: object.phetioHighFrequency,
        phetioPlayback: object.phetioPlayback,
        phetioStudioControl: object.phetioStudioControl,
        phetioDynamicElement: object.phetioDynamicElement,
        phetioDynamicElementPrototype: object.phetioDynamicElementPrototype,
        phetioFeatured: object.phetioFeatured
      };
    },

    DEFAULT_OPTIONS: DEFAULTS // the default options for the phet-io object
  } );

  /**
   * Internal class to avoid cyclic dependencies.
   * @private
   */
  class LinkedElement extends PhetioObject {

    /**
     * @param {Object} coreElement
     * @param {Object} [options]
     */
    constructor( coreElement, options ) {
      assert && assert( !!coreElement, 'coreElement should be defined' );
      assert && assert( coreElement instanceof PhetioObject, 'coreElement should be PhetioObject' );
      assert && assert( coreElement.tandem, 'coreElement should have a tandem' );

      super( merge( {
        phetioType: LinkedElementIO,
        phetioReadOnly: true, // References cannot be changed

        // By default, this linked element's baseline value is the overridden value of the coreElement. This allows
        // the them to be in sync by default, but also allows the linked element to be overridden in studio.
        phetioFeatured: coreElement.phetioFeatured
      }, options ) );

      // @public (read-only)
      this.element = coreElement;
    }
  }

  return PhetioObject;
} );