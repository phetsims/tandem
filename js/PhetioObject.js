// Copyright 2017-2020, University of Colorado Boulder

/**
 * Base type that provides PhET-iO features. An instrumented PhetioObject is referred to on the wrapper side/design side
 * as a "PhET-iO element".  Note that sims may have hundreds or thousands of PhetioObjects, so performance and memory
 * considerations are important.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import timer from '../../axon/js/timer.js';
import validate from '../../axon/js/validate.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import inherit from '../../phet-core/js/inherit.js';
import merge from '../../phet-core/js/merge.js';
import EventType from './EventType.js';
import LinkedElementIO from './LinkedElementIO.js';
import phetioAPIValidation from './phetioAPIValidation.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

// constants
const PHET_IO_ENABLED = Tandem.PHET_IO_ENABLED;
const IO_TYPE_VALIDATOR = { isValidValue: ObjectIO.isIOType };
const BOOLEAN_VALIDATOR = { valueType: 'boolean' };

// use "<br>" instead of newlines
const PHET_IO_DOCUMENTATION_VALIDATOR = { valueType: 'string', isValidValue: doc => doc.indexOf( '\n' ) === -1 };
const PHET_IO_EVENT_TYPE_VALIDATOR = { valueType: EventType };
const PHET_IO_COMPONENT_OPTIONS_VALIDATOR = {
  isValidValue: options =>
    _.every( _.keys( options ), key => SUPPORTED_PHET_IO_COMPONENT_OPTIONS.indexOf( key ) >= 0 )
};
const OBJECT_VALIDATOR = { valueType: [ Object, null ] };

// Indicates a high frequency message was skipped.
const SKIPPING_HIGH_FREQUENCY_MESSAGE = -1;

// Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
const EMPTY_OBJECT = {};

const DEFAULTS = {

  // Subtypes can use `Tandem.tandemRequired` to require a named tandem passed in
  tandem: Tandem.OPTIONAL,

  // Defines API methods, events and serialization
  phetioType: ObjectIO,

  // {string} Useful notes about an instrumented PhetioObject, shown in the PhET-iO Studio Wrapper. It's an html
  // string, so "<br>" tags are required instead of "\n" characters for proper rendering in Studio
  phetioDocumentation: '',

  // When true, includes the PhetioObject in the PhET-iO state (not automatically recursive, may require
  // phetioComponentOptions for Nodes or other types)
  phetioState: true,

  // This option controls how PhET-iO wrappers can interface with this PhetioObject. Predominately this occurs via
  // public methods defined on this PhetioObject's phetioType, in which some method are not executable when this flag
  // is true. See `ObjectIO.methods` for further documentation, especially regarding `invocableForReadOnlyElements`.
  phetioReadOnly: false,

  // Category of event type, can be overridden in phetioStartEvent options
  phetioEventType: EventType.MODEL,

  // High frequency events such as mouse moves can be omitted from data stream, see ?phetioEmitHighFrequencyEvents
  // and Client.launchSim option
  phetioHighFrequency: false,

  // When true, emits events for data streams for playback, see handlePlaybackEvent.js
  phetioPlayback: false,

  // When true, Studio is allowed to create a control for this PhetioObject (if it knows how)
  phetioStudioControl: true,

  // For propagating phetio options to sub-components, see SUPPORTED_PHET_IO_COMPONENT_OPTIONS. Since supported
  // components most often don't end in "Options", `merge` doesn't support defaults and overwriting as expected. As a
  // result, types that want to specify default component options must use `PhetioObject.mergePhetioComponentOptions
  // to make sure that component options are properly sent up to PhetioObject.
  phetioComponentOptions: EMPTY_OBJECT,

  // When true, this is categorized as an important "featured" element in Studio.
  phetioFeatured: false,

  // {Object|null} optional - delivered with each event, if specified. phetioPlayback is appended here, if true.
  // Note: unlike other options, this option can be mutated downstream, and hence should be created newly for each instance.
  phetioEventMetadata: null,

  // {boolean} optional - indicates that an object may or may not have been created. Applies recursively automatically
  // and should only be set manually on the root dynamic element. Dynamic archetypes will have this overwritten to
  // false even if explicitly provided as true, as archetypes cannot be dynamic.
  phetioDynamicElement: false
};

// phetioComponentOptions can specify either (a) the name of the specific subcomponent to target or (b) use a key from
// DEFAULTS to apply to all subcomponents
const SUPPORTED_PHET_IO_COMPONENT_OPTIONS = _.keys( DEFAULTS ).concat( [

  // NodeIO
  'visibleProperty', 'pickableProperty', 'opacityProperty',

  // TextIO
  'textProperty'
] );

/**
 * @param {Object} [options]
 * @constructor
 */
function PhetioObject( options ) {

  // @public (read-only) {Tandem} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
  this.tandem = DEFAULTS.tandem;

  // @public (read-only) {IOType} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
  this.phetioType = DEFAULTS.phetioType;

  // @public (read-only) {boolean} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
  this.phetioState = DEFAULTS.phetioState;

  // @public (read-only) {boolean} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
  this.phetioReadOnly = DEFAULTS.phetioReadOnly;

  // @public (read-only) {string} - assigned in initializePhetioObject - see docs at DEFAULTS declaration
  this.phetioDocumentation = DEFAULTS.phetioDocumentation;

  // @private {EventType} - see docs at DEFAULTS declaration
  this.phetioEventType = DEFAULTS.phetioEventType;

  // @private {boolean} - see docs at DEFAULTS declaration
  this.phetioHighFrequency = DEFAULTS.phetioHighFrequency;

  // @private {boolean} - see docs at DEFAULTS declaration
  this.phetioPlayback = DEFAULTS.phetioPlayback;

  // @private {boolean} - see docs at DEFAULTS declaration
  this.phetioStudioControl = DEFAULTS.phetioStudioControl;

  // @public (PhetioEngine) {boolean} - see docs at DEFAULTS declaration - in order to recursively pass this value to
  // children, the setPhetioDynamicElement() function must be used instead of setting this attribute directly
  this.phetioDynamicElement = DEFAULTS.phetioDynamicElement;

  // @public (read-only) {boolean} - see docs at DEFAULTS declaration
  this.phetioFeatured = DEFAULTS.phetioFeatured;

  // @private {Object|null}
  this.phetioEventMetadata = DEFAULTS.phetioEventMetadata;

  // @public (read-only) {Object} - see docs at DEFAULTS declaration
  this.phetioComponentOptions = DEFAULTS.phetioComponentOptions;

  // @public (read-only) {ObjectIO|null} - assigned in initializePhetioObject - the instantiated IO type. The phetioWrapper
  // is the API layer between the wrapper and the phetioObject. It's used to call methods on this phetioObject from
  // the wrapper frame. Will be null if this PhetioObject is never instrumented.
  this.phetioWrapper = null;

  // @private {boolean} - track whether the object has been initialized.  This is necessary because initialization
  // can happen in the constructor or in a subsequent call to initializePhetioObject (to support scenery Node)
  this.phetioObjectInitialized = false;

  // @private {number|null} - tracks the indices of started messages so that dataStream can check that ends match starts
  this.phetioMessageStack = [];

  // @public (read-only) {boolean} - has it been disposed?
  this.isDisposed = false;

  // @public {boolean} optional - Indicates that an object is a archetype for a dynamic class. Settable only by
  // PhetioEngine and by classes that create dynamic elements when creating their archetype (like PhetioGroup) through
  // PhetioObject.markDynamicElementArchetype().
  // if true, items will be excluded from phetioState. This applies recursively automatically.
  this.phetioIsArchetype = null;

  // @public (phetioEngine) {Object|null} - only non null with phet.preloads.phetio.queryParameters.phetioPrintAPI enabled
  this.phetioBaselineMetadata = null;

  // @private {string|null} - for phetioDynamicElements, the corresponding phetioID for the element in the archetype subtree
  this.phetioArchetypePhetioID = null;

  // @private {LinkedElement[]|null} - keep track of LinkedElements for disposal. Null out to support asserting on
  // edge error cases, see this.addLinkedElement()
  this.linkedElements = [];

  // @public (phet-io) set to true when this PhetioObject has been sent over to the parent.
  this.phetioNotifiedObjectCreated = false;

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

/**
 * Determine if any of the options keys are intended for PhetioObject. Semantically equivalent to
 * _.intersection( _.keys( options ), _.keys( DEFAULTS) ).length>0 but implemented imperatively to avoid memory or
 * performance issues. Also handles options.tandem differently.
 * @param {Object} [options]
 * @returns {boolean}
 */
const specifiesNonTandemPhetioObjectKey = options => {
  for ( const key in options ) {
    if ( key !== 'tandem' && options.hasOwnProperty( key ) && DEFAULTS.hasOwnProperty( key ) ) {
      return true;
    }
  }
  return false;
};

// Since PhetioObject is extended with inherit (e.g., SCENERY/Node), this cannot be an ES6 class
inherit( Object, PhetioObject, {

  /**
   * Like SCENERY/Node, PhetioObject can be configured during construction or later with a mutate call.
   * Noop if provided config keys don't intersect with any key in DEFAULTS; baseOptions are ignored for this calculation.
   *
   * @param {Object} baseOptions
   * @param {Object} config
   * @protected
   */
  initializePhetioObject: function( baseOptions, config ) {
    assert && assert( config, 'initializePhetioObject must be called with config' );

    // The presence of `tandem` indicates if this PhetioObject can be intiialized. If not yet initialized, perhaps
    // it will be initialized later on, as in Node.mutate().
    if ( !( config.tandem && config.tandem.supplied ) ) {
      assert && !config.tandem && assert( !specifiesNonTandemPhetioObjectKey( config ), 'only specify metadata when providing a Tandem' );

      if ( config.tandem ) {
        this.tandem = config.tandem;
      }
      return;
    }

    // assert this after the `specifiesPhetioObjectKey check to support something like:
    // `new Node( {tandem: tandem}).mutate({})`
    assert && assert( !this.phetioObjectInitialized, 'cannot initialize twice' );

    validate( config.tandem, { valueType: Tandem } );

    config = merge( {}, DEFAULTS, baseOptions, config );

    // validate config before assigning to properties
    validate( config.phetioType, IO_TYPE_VALIDATOR );
    validate( config.phetioState, BOOLEAN_VALIDATOR );
    validate( config.phetioReadOnly, BOOLEAN_VALIDATOR );
    validate( config.phetioEventType, PHET_IO_EVENT_TYPE_VALIDATOR );
    validate( config.phetioDocumentation, PHET_IO_DOCUMENTATION_VALIDATOR );
    validate( config.phetioHighFrequency, BOOLEAN_VALIDATOR );
    validate( config.phetioPlayback, BOOLEAN_VALIDATOR );
    validate( config.phetioStudioControl, BOOLEAN_VALIDATOR );
    validate( config.phetioComponentOptions, PHET_IO_COMPONENT_OPTIONS_VALIDATOR );
    validate( config.phetioFeatured, BOOLEAN_VALIDATOR );
    validate( config.phetioEventMetadata, OBJECT_VALIDATOR );
    validate( config.phetioDynamicElement, BOOLEAN_VALIDATOR );

    // This block is associated with validating the baseline api and filling in metadata specified in the elements
    // overrides API file. Even when validation is not enabled, overrides should still be applied.
    if ( PHET_IO_ENABLED && config.tandem.supplied ) {

      // Store the full baseline for usage in validation or for usage in studio.  Do this before applying overrides. The
      // baseline is created when a sim is run with assertions to assist in phetioAPIValidation.  However, even when
      // assertions are disabled, some wrappers such as studio need to generate the baseline anyway.
      if ( phetioAPIValidation.enabled || phet.preloads.phetio.queryParameters.studio ) {

        // not all metadata are passed through via config, so store baseline for these additional properties
        this.phetioBaselineMetadata = this.getMetadata( merge( {
          phetioIsArchetype: this.phetioIsArchetype
        }, config ) );
      }

      // If not a deprecated dynamic element
      // TODO: Remove '~' check once TANDEM/Tandem.GroupTandem usages have been replaced, see https://github.com/phetsims/tandem/issues/87 and https://github.com/phetsims/phet-io/issues/1409
      if ( config.tandem.phetioID.indexOf( '~' ) === -1 ) {

        // Dynamic elements should compare to their "concrete" counterparts.  For example, this means that a Particle
        // in a PhetioGroup will take its overrides from the PhetioGroup archetype.
        const concretePhetioID = config.tandem.getConcretePhetioID();

        // Overrides are only defined for simulations, not for unit tests.  See https://github.com/phetsims/phet-io/issues/1461
        // Patch in the desired values from overrides, if any.
        if ( window.phet.preloads.phetio.phetioElementsOverrides ) {
          const overrides = window.phet.preloads.phetio.phetioElementsOverrides[ concretePhetioID ];
          if ( overrides ) {

            // No need to make a new object, since this "config" variable was created in the previous merge call above.
            config = merge( config, overrides );
          }
        }
      }
    }

    // Unpack config to properties
    this.tandem = config.tandem;
    this.phetioType = config.phetioType;
    this.phetioState = config.phetioState;
    this.phetioReadOnly = config.phetioReadOnly;
    this.phetioEventType = config.phetioEventType;
    this.phetioDocumentation = config.phetioDocumentation;
    this.phetioHighFrequency = config.phetioHighFrequency;
    this.phetioPlayback = config.phetioPlayback;
    this.phetioStudioControl = config.phetioStudioControl;
    this.phetioComponentOptions = config.phetioComponentOptions;
    this.phetioFeatured = config.phetioFeatured;
    this.phetioEventMetadata = config.phetioEventMetadata;
    this.phetioDynamicElement = config.phetioDynamicElement;

    // Make sure playback shows in the phetioEventMetadata
    if ( this.phetioPlayback ) {
      this.phetioEventMetadata = this.phetioEventMetadata || {};
      assert && assert( !this.phetioEventMetadata.hasOwnProperty( 'playback' ), 'phetioEventMetadata.playback should not already exist' );
      this.phetioEventMetadata.playback = true;
    }

    // Instantiate the wrapper instance which is used for PhET-iO communication
    if ( PHET_IO_ENABLED && this.isPhetioInstrumented() ) {
      // this assertion should be enabled for new phet-io sim publications
      // TODO: are we really going to add phetioDocumentation to every PhetioObject?, see https://github.com/phetsims/phet-io/issues/1409
      // TODO: If so, this assertion should be elsewhere, see https://github.com/phetsims/phet-io/issues/1409
      // assert && assert( this.phetioDocumentation, 'phetioDocumentation is required for: ' + this.tandem.phetioID );

      // @public (read-only phet-io-internal)
      this.phetioWrapper = new this.phetioType( this, this.tandem.phetioID );
    }
    this.tandem.addPhetioObject( this );
    this.phetioObjectInitialized = true;
  },

  /**
   * Start an event for the nested PhET-iO data stream.
   *
   * @param {string} event - the name of the event
   * @param {Object} [options]
   * @public
   */
  phetioStartEvent: function( event, options ) {

    if ( PHET_IO_ENABLED && this.isPhetioInstrumented() ) {

      // only one or the other can be provided
      assert && assertMutuallyExclusiveOptions( options, [ 'data' ], [ 'getData' ] );
      options = merge( {

        // {Object|null} - the data
        data: null,

        // {function():Object|null} - function that, when called get's the data.
        getData: null
      }, options );

      assert && assert( this.phetioObjectInitialized, 'phetioObject should be initialized' );
      assert && assert( typeof event === 'string' );
      assert && options.data && assert( typeof options.data === 'object' );
      assert && options.getData && assert( typeof options.getData === 'function' );
      assert && assert( arguments.length === 1 || arguments.length === 2, 'Prevent usage of incorrect signature' );

      if ( this.phetioHighFrequency &&

           // Opt out of certain events if queryParameter override is provided
           _.hasIn( window, 'phet.preloads.phetio.queryParameters' ) && !window.phet.preloads.phetio.queryParameters.phetioEmitHighFrequencyEvents &&

           // Even for a low frequency data stream, high frequency events can still be emitted when they have a low frequency ancestor.
           !phet.phetio.dataStream.isEmittingLowFrequencyEvent() ) {
        this.phetioMessageStack.push( SKIPPING_HIGH_FREQUENCY_MESSAGE );
        return;
      }

      // Only get the args if we are actually going to send the event.
      const data = options.getData ? options.getData() : options.data;

      this.phetioMessageStack.push(
        phet.phetio.dataStream.start( this.phetioEventType, this.tandem.phetioID, this.phetioType, event, data, this.phetioEventMetadata, this.phetioHighFrequency )
      );
    }
  },

  /**
   * End an event on the nested PhET-iO data stream. It this object was disposed or dataStream.start was not called,
   * this is a no-op.
   * @public
   */
  phetioEndEvent: function() {
    if ( PHET_IO_ENABLED && this.isPhetioInstrumented() ) {

      const topMessageIndex = this.phetioMessageStack.pop();

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if ( topMessageIndex === SKIPPING_HIGH_FREQUENCY_MESSAGE ) {
        return;
      }
      phet.phetio.dataStream.end( topMessageIndex );
    }
  },

  /**
   * Set any instrumented descendants of this PhetioObject to the same value as this.phetioDynamicElement.
   * @private
   */
  propagateDynamicFlagsToDescendants: function() {
    assert && assert( Tandem.PHET_IO_ENABLED, 'phet-io should be enabled' );
    assert && assert( phet.phetio && phet.phetio.phetioEngine, 'Dynamic elements cannot be created statically before phetioEngine exists.' );
    const phetioEngine = phet.phetio.phetioEngine;

    this.tandem.iterateDescendants( tandem => {
      if ( phetioEngine.hasPhetioObject( tandem.phetioID ) ) {
        const phetioObject = phetioEngine.getPhetioObject( tandem.phetioID );

        // Order matters here! The phetioIsArchetype needs to be first to ensure that the setPhetioDynamicElement
        // setter can opt out for archetypes.
        phetioObject.phetioIsArchetype = this.phetioIsArchetype;
        phetioObject.setPhetioDynamicElement( this.phetioDynamicElement );

        if ( phetioObject.phetioBaselineMetadata ) {
          phetioObject.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
        }
      }
    } );
  },

  /**
   * @param {boolean} phetioDynamicElement
   * @public (PhetioEngine)
   */
  setPhetioDynamicElement( phetioDynamicElement ) {
    assert && assert( !this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.' );

    // If this element is a archetype, it is not a dynamic element.
    this.phetioDynamicElement = this.phetioIsArchetype ? false : phetioDynamicElement;

    // For dynamic elements, indicate the corresponding archetype element so that clients like Studio can leverage
    // the archetype metadata. Static elements don't have archetypes.
    this.phetioArchetypePhetioID = phetioDynamicElement ? this.tandem.getConcretePhetioID() : null;

    // Keep the baseline metadata in sync.
    if ( this.phetioBaselineMetadata ) {
      this.phetioBaselineMetadata.phetioDynamicElement = this.phetioDynamicElement;
    }
  },

  /**
   * Mark this PhetioObject as a archetype for a dynamic element.
   * @public
   */
  markDynamicElementArchetype: function() {
    assert && assert( !this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.' );

    this.phetioIsArchetype = true;
    this.setPhetioDynamicElement( false ); // because archetypes aren't dynamic elements

    if ( this.phetioBaselineMetadata ) {
      this.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
    }

    // recompute for children also, but only if phet-io is enabled
    Tandem.PHET_IO_ENABLED && this.propagateDynamicFlagsToDescendants();
  },

  /**
   * A PhetioObject will only be instrumented if the tandem that was passed in was "supplied". See Tandem.supplied
   * for more info.
   * @returns {boolean}
   * @public
   */
  isPhetioInstrumented: function() {
    return this.tandem && this.tandem.supplied;
  },

  /**
   * When an instrumented PhetioObject is linked with another instrumented PhetioObject, this creates a one-way
   * association which is rendered in Studio as a "symbolic" link or hyperlink. Many common code UI elements use this
   * automatically. To keep client sites simple, this has a graceful opt-out mechanism which makes this function a
   * no-op if either this PhetioObject or the target PhetioObject is not instrumented.
   * @param {PhetioObject} element - the target element. Must be instrumented for a LinkedElement to be created--
   *                               - otherwise it gracefully opts out
   * @param {Object} [options]
   * @public
   */
  addLinkedElement: function( element, options ) {
    if ( !this.isPhetioInstrumented() ) {

      // set this to null so that you can't addLinkedElement on an uninitialized PhetioObject and then instrumented
      // it afterwards.
      this.linkedElements = null;
      return;
    }

    assert && assert( element instanceof PhetioObject, 'element must be of type PhetioObject' );

    // In some cases, UI components need to be wired up to a private (internal) Property which should neither be
    // instrumented nor linked.
    if ( PHET_IO_ENABLED && element.isPhetioInstrumented() ) {
      assert && assert( Array.isArray( this.linkedElements ), 'linkedElements should be an array' );
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
    // The phetioEvent stack should resolve by the next frame, so that's when we check it.
    assert && timer.runOnNextFrame( () => {
      assert && assert( self.phetioMessageStack.length === 0, 'phetioMessageStack should be clear' );
    } );

    if ( this.phetioObjectInitialized ) {
      this.tandem.removePhetioObject( this );
      this.phetioWrapper && this.phetioWrapper.dispose && this.phetioWrapper.dispose();
    }

    // Dispose LinkedElements
    if ( this.linkedElements ) {
      this.linkedElements.forEach( linkedElement => linkedElement.dispose() );
      this.linkedElements.length = 0;
    }

    this.isDisposed = true;
  },

  /**
   * JSONifiable metadata that describes the nature of the PhetioObject.  We must be able to read this
   * for baseline (before object fully constructed we use object) and after fully constructed
   * which includes overrides.
   * @param {Object} [object] - used to get metadata keys, can be a PhetioObject, or an options object
   *                          (see usage initializePhetioObject). If not provided, will instead use the value of "this"
   * @returns {Object} - metadata plucked from the passed in parameter
   * @public
   */
  getMetadata: function( object ) {
    object = object || this;
    const metadata = {
      phetioTypeName: object.phetioType.typeName,
      phetioDocumentation: object.phetioDocumentation,
      phetioState: object.phetioState,
      phetioReadOnly: object.phetioReadOnly,
      phetioEventType: EventType.phetioType.toStateObject( object.phetioEventType ),
      phetioHighFrequency: object.phetioHighFrequency,
      phetioPlayback: object.phetioPlayback,
      phetioStudioControl: object.phetioStudioControl,
      phetioDynamicElement: object.phetioDynamicElement,
      phetioIsArchetype: object.phetioIsArchetype,
      phetioFeatured: object.phetioFeatured
    };
    if ( object.phetioArchetypePhetioID ) {
      metadata.phetioArchetypePhetioID = object.phetioArchetypePhetioID;
    }
    return metadata;
  }
}, {

  /**
   * Convenience function which assigns phetioComponentOptions based on a merge, and performs basic sanity checks.
   * @public
   * @param {Object} defaults
   * @param {Object} [options] - mutated to included merged phetioComponentOptions
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

  DEFAULT_OPTIONS: DEFAULTS // the default options for the phet-io object
} );

/**
 * Internal class to avoid cyclic dependencies.
 * @private
 */
class LinkedElement extends PhetioObject {

  /**
   * @param {PhetioObject} coreElement
   * @param {Object} [options]
   */
  constructor( coreElement, options ) {
    assert && assert( !!coreElement, 'coreElement should be defined' );
    assert && assert( coreElement instanceof PhetioObject, 'coreElement should be PhetioObject' );
    assert && assert( coreElement.tandem, 'coreElement should have a tandem' );

    options = merge( {
      phetioType: LinkedElementIO
    }, options );

    // References cannot be changed by PhET-iO
    assert && assert( !options.hasOwnProperty( 'phetioReadOnly' ), 'phetioReadOnly set by LinkedElement' );
    options.phetioReadOnly = true;

    // By default, this linked element's baseline value is the overridden value of the coreElement. This allows
    // the them to be in sync by default, but also allows the linked element to be overridden in studio.
    assert && assert( !options.hasOwnProperty( 'phetioFeatured' ), 'phetioFeatured set by LinkedElement' );
    options.phetioFeatured = coreElement.phetioFeatured;

    super( options );

    // @public (read-only)
    this.element = coreElement;
  }

  /**
   * LinkedElements listen to their core elements for phetioFeatured, so to avoid a dependency on overrides metadata
   * (when the core element's phetioFeatured is specified in the overrides file), ignore phetioFeatured for LinkedElements.
   * @override
   * @param {Object} object - used to get metadata keys, can be a PhetioObject, or an options object
   *                          (see usage initializePhetioObject)
   * @returns {Object} - metadata plucked from the passed in parameter
   * @public
   */
  getMetadata( object ) {
    const phetioObjectMetadata = super.getMetadata( object );
    delete phetioObjectMetadata.phetioFeatured;
    return phetioObjectMetadata;
  }
}

tandemNamespace.register( 'PhetioObject', PhetioObject );
export default PhetioObject;