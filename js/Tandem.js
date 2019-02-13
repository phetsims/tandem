// Copyright 2015-2019, University of Colorado Boulder

/**
 * Tandem is used to assign unique identifiers to PhetioObjects in PhET simulations and register/unregister them in a
 * registry. It is used to support PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var toCamelCase = require( 'PHET_CORE/toCamelCase' );

  // text
  var packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  var packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so requiring packageJSON doesn't work
  var PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );

  // used to keep track of missing tandems, see phet.phetio.queryParameters.phetioPrintMissingTandems
  var missingTandems = {
    required: [],
    optional: [],
    uninstrumented: []
  };

  // Listeners that will be notified when items are registered/deregistered. See doc in addPhetioObjectListener
  var phetioObjectListeners = [];

  // variables
  // Before listeners are wired up, tandems are buffered.  When listeners are wired up, Tandem.launch() is called
  // and buffered tandems are flushed, then subsequent tandems are delivered to listeners directly
  var launched = false;
  var bufferedPhetioObjects = [];

  /**
   * Typically, sims will create tandems using `tandem.createTandem`.  This constructor is used internally or when
   * a tandem must be created from scratch.
   *
   * @param {string} phetioID - unique identifier as a string ('' for a root id)
   * @param {Object} [options]
   * @constructor
   */
  function Tandem( phetioID, options ) {

    assert && assert( phetioID.indexOf( ' ' ) === -1, 'phetioID cannot contain whitespace: ' + phetioID );

    // options (even subtype options) must be stored on the instance so they can be passed through to children
    // Note: Make sure that added options here are also added to options for inheritance and/or
    // for composition (createTandem/parentTandem) as they make sense.
    options = _.extend( {

      // if the tandem is not supplied and required, an error will be thrown.
      supplied: true,

      // required === false means it is an optional tandem
      required: true
    }, options );

    // @public (read-only)
    this.phetioID = ( phetioID !== undefined ) ? phetioID : '';

    // @private
    this.required = options.required;

    // @private
    this.supplied = options.supplied;
  }

  tandemNamespace.register( 'Tandem', Tandem );

  inherit( Object, Tandem, {

    /**
     * Adds a PhetioObject.  For example, it could be an axon Property, scenery Node or Sun button.  Each item should
     * only be added to the registry once, but that is not enforced here in Tandem.  For PhET-iO, phetioEngine.js
     * enforces one entry per ID in phetio.phetioObjectAdded
     *
     * This is used to register PhetioObjects with PhET-iO.
     * @param {PhetioObject} phetioObject
     * @public
     */
    addPhetioObject: function( phetioObject ) {
      assert && assert( arguments.length === 1, 'Tandem.addPhetioObject takes one argument' );

      // Cannot use typical require statement for PhetioObject because it creates a module loading loop
      assert && assert( phetioObject instanceof tandemNamespace.PhetioObject, 'argument should be of type PhetioObject' );

      if ( PHET_IO_ENABLED ) {

        // Throw an error if the tandem is required but not supplied
        if ( Tandem.validationEnabled() ) {
          assert && assert( !( this.required && !this.supplied ), 'Tandem was required but not supplied' );
        }

        // phetioPrintMissingTandems flag is present for a tandem that is required but not supplied.
        if ( phet.phetio.queryParameters.phetioPrintMissingTandems && ( this.required && !this.supplied ) ) {
          missingTandems.required.push( { phetioID: this.phetioID, stack: new Error().stack } );
        }

        // If tandem is optional, then don't add it
        if ( !this.required && !this.supplied ) {
          if ( phet.phetio.queryParameters.phetioPrintMissingTandems ) {
            var stackTrace = new Error().stack;

            // Generally Font is not desired because there are so many untandemized Fonts.
            if ( stackTrace.indexOf( 'PhetFont' ) === -1 ) {
              missingTandems.optional.push( { phetioID: this.phetioID, stack: stackTrace } );
            }
          }

          // For optionally instrumented types that are not provided tandems, the instance isn't really "added"
          // but likewise, it in not an error
          return;
        }

        if ( !launched ) {
          bufferedPhetioObjects.push( phetioObject );
        }
        else {
          for ( var i = 0; i < phetioObjectListeners.length; i++ ) {
            phetioObjectListeners[ i ].addPhetioObject( phetioObject );
          }
        }
      }
    },

    /**
     * Removes an instance from the registry
     * @param {PhetioObject} phetioObject - the instance to remove
     * @public
     */
    removeInstance: function( phetioObject ) {
      if ( !this.required && !this.supplied ) {
        return;
      }

      // Only active when running as phet-io
      if ( PHET_IO_ENABLED ) {
        for ( var i = 0; i < phetioObjectListeners.length; i++ ) {
          phetioObjectListeners[ i ].removePhetioObject( phetioObject );
        }
      }
    },

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @param {Object} [options]
     * @returns {Tandem}
     * @public
     */
    createTandem: function( id, options ) {

      // Make sure the id was provided
      assert && assert( typeof id === 'string' && id.length > 0, 'id must be defined' );
      assert && assert( id.indexOf( '.' ) === -1, 'createTandem cannot accept dots: ' + id );
      assert && assert( id.indexOf( ' ' ) === -1, 'createTandem cannot accept whitespace: ' + id );

      var string = ( this.phetioID.length > 0 ) ? phetio.PhetioIDUtils.append( this.phetioID, id ) : id;

      // Any child of something should be passed all inherited options. Make sure that this extend call includes all
      // that make sense from the constructor's extend call.
      options = _.extend( {
        supplied: this.supplied,
        required: this.required
      }, options );

      return new Tandem( string, options );
    },

    /**
     * Creates a group tandem for creating multiple indexed child tandems, such as:
     * sim.screen.model.electron_0
     * sim.screen.model.electron_1
     *
     * In this case, 'sim.screen.model.electron' is the string passed to createGroupTandem.
     *
     * Used for arrays, observable arrays, or when many elements of the same type are created and they do not otherwise
     * have unique identifiers.
     * @param id
     * @returns {GroupTandem}
     * @public
     */
    createGroupTandem: function( id ) {

      assert && assert( id.indexOf( '.' ) === -1, 'createTandem cannot accept dots: ' + id );
      assert && assert( id.indexOf( ' ' ) === -1, 'createTandem cannot accept whitespace: ' + id );

      // Unfortunately we must resort to globals here since loading through the namespace would create a cycle
      return new GroupTandem( phetio.PhetioIDUtils.append( this.phetioID, id ) );
    },

    /**
     * Get the last part of the tandem (after the last .), used in Joist for creating button names dynamically based
     * on screen names
     * @returns {string} the tail of the tandem
     * @public
     */
    get tail() { // TODO: rename to getComponentName()
      return phetio.PhetioIDUtils.getComponentName( this.phetioID );
    },

    /**
     * Returns a Tandem for everything except the tail.
     * @returns {Tandem}
     * @public
     */
    get parentTandem() {
      var headID = phetio.PhetioIDUtils.getParentID( this.phetioID );

      return new Tandem( headID, {
        required: this.required,
        supplied: this.supplied
      } );
    }
  }, {

    /**
     * Adds a listener that will be notified when items are registered/deregistered
     * Listeners have the form
     * {
     *   addPhetioObject(id,phetioObject),
     *   removePhetioObject(id,phetioObject)
     * }
     * where id is of type {string} and phetioObject is of type {PhetioObject}
     *
     * @param {Object} phetioObjectListener - described above
     * @public
     * @static
     */
    addPhetioObjectListener: function( phetioObjectListener ) {
      phetioObjectListeners.push( phetioObjectListener );
    },

    /**
     * When all listeners are listening, all buffered PhetioObjects are registered.
     * @public
     * @static
     */
    launch: function() {
      assert && assert( !launched, 'Tandem was launched twice' );
      launched = true;
      while ( bufferedPhetioObjects.length > 0 ) {
        var phetioObject = bufferedPhetioObjects.shift();
        phetioObject.register();
      }
    },

    /**
     * Catch cases where tandem is being supplied to a class that doesn't support tandem.
     * @param {Object} [options]
     * @public
     * @static
     */
    disallowTandem: function( options ) {

      if ( Tandem.validationEnabled() ) {
        assert && assert( !options.tandem, 'tandem is not allowed' );
      }
    },

    /**
     * When running in PhET-iO brand, some code (such as user interface components) must be instrumented for PhET-iO.
     * Uninstrumented files should call this function to indicate they still need to be instrumented, so they aren't
     * missed.  See https://github.com/phetsims/phet-io/issues/668
     * @public
     * @static
     */
    indicateUninstrumentedCode: function() {

      // Guard against undefined errors
      if ( PHET_IO_ENABLED ) {

        // Assert if validating tandems
        if ( this.validationEnabled() ) {
          assert && assert( false, 'Uninstrumented code detected' );
        }

        // Print stack trace if query parameter supplied
        if ( phet.phetio.queryParameters.phetioPrintMissingTandems ) {
          missingTandems.uninstrumented.push( { stack: new Error().stack } );
        }
      }
    },

    /**
     * Determine whether or not tandem validation is turned on for the sim.
     * @returns {Boolean} If tandems are being validated or not.
     * @public
     * @static
     */
    validationEnabled: function() {
      return PHET_IO_ENABLED &&
             phet.phetio.queryParameters.phetioValidateTandems &&

             // If we are printing the missing tandems, then validation must be disabled because the intention is to
             // run with partial tandem coverage and see which are missing.
             !phet.phetio.queryParameters.phetioPrintMissingTandems;
    },

    /**
     * Returns true if the buffered P contain the given phetioID.
     * @param {string} phetioID
     * @returns {boolean}
     * @public
     */
    containsBufferedID: function( phetioID ) {
      return bufferedPhetioObjects.map( phetioObject => phetioObject.tandem.phetioID ).indexOf( phetioID ) >= 0;
    }
  } );

  // The next few statics are created outside the static block because they instantiate Tandem instances.

  /**
   * The root tandem for a simulation
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.rootTandem = new Tandem( toCamelCase( packageJSON.name ) );

  /**
   * Many simulation elements are nested under "general".
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.generalTandem = Tandem.rootTandem.createTandem( 'general' );

  /**
   * Used to indicate a common code component that supports tandem, but doesn't not require it.
   * If a tandem is not passed through to this instance, then it will not be instrumented.
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.optional = Tandem.rootTandem.createTandem( 'optionalTandem', {
    required: false,
    supplied: false
  } );

  /**
   * Some common code (such as Checkbox or RadioButton) must always be instrumented and hence requires a tandem to be
   * passed in.
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.required = Tandem.rootTandem.createTandem( 'requiredTandem', {

    // let phetioPrintMissingTandems bypass this
    required: PHET_IO_ENABLED && ( phet.phetio.queryParameters.phetioValidateTandems || phet.phetio.queryParameters.phetioPrintMissingTandems ),
    supplied: false
  } );

  /**
   * Expose collected missing tandems only populated from specific query parameter, see phetioPrintMissingTandems for more
   * @public (phet-io internal)
   * @type {Object}
   */
  Tandem.missingTandems = missingTandems;

  /**
   * Group Tandem -- Declared in the same file to avoid circular reference errors in module loading.
   * @param {string} id - id as a string (or '' for a root id)
   * @constructor
   * @private create with Tandem.createGroupTandem
   */
  function GroupTandem( id ) {

    Tandem.call( this, id );

    // @private for generating indices from a pool
    this.groupElementIndex = 0;
  }

  tandemNamespace.register( 'Tandem.GroupTandem', GroupTandem );

  inherit( Tandem, GroupTandem, {

    /**
     * Creates the next tandem in the group.
     * @returns {Tandem}
     * @public
     */
    createNextTandem: function() {
      return new Tandem( this.phetioID + '_' + ( this.groupElementIndex++ ) );
    }
  } );

  return Tandem;
} );