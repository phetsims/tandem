// Copyright 2015, University of Colorado Boulder

/**
 * Tandem is used to assign unique identifiers to instances in PhET simulations and register/unregister them in a
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

  // Listeners that will be notified when items are registered/deregistered. See doc in addInstanceListener
  var instanceListeners = [];

  // variables
  // Before listeners are wired up, tandems are buffered.  When listeners are wired up, Tandem.launch() is called
  // and buffered tandems are flushed, then subsequent tandems are delivered to listeners directly
  var launched = false;
  var bufferedInstances = [];

  // increment names of uninstrumented common code tandems to avoid collisions for uninstrumented sims with
  // phetioValidateTandems=false
  var uninstrumentedCodeIndex = 0;

  /**
   * Typically, sims will create tandems using `tandem.createTandem`.  This constructor is used internally or when
   * a tandem must be created from scratch.
   *
   * @param {string} id - id as a string (or '' for a root id)
   * @param {Object} [options]
   * @constructor
   */
  function Tandem( id, options ) {

    // options (even subtype options) must be stored on the instance so they can be passed through to children
    // Note: Make sure that added options here are also added to options for inheritance and/or
    // for composition (createTandem/parentTandem) as they make sense.
    options = _.extend( {

      // Enabled tandems notify listeners when they are added. Disabled tandems do not notify listeners,
      // but children of a disabled tandem may be enabled.
      enabled: true,

      // if the tandem is not supplied and required, an error will be thrown.
      supplied: true,

      // required === false means it is an optional tandem
      required: true
    }, options );

    // @public (read-only)
    this.id = ( id !== undefined ) ? id : '';

    // @private
    this.required = options.required;

    // @private
    this.supplied = options.supplied;

    // @private
    this.enabled = options.enabled;
  }

  tandemNamespace.register( 'Tandem', Tandem );

  inherit( Object, Tandem, {

    /**
     * Adds an instance of any type.  For example, it could be an axon Property, scenery Node or Sun button.  Each
     * item should only be added to the registry once, but that is not enforced here in Tandem.  For PhET-iO, phetio.js
     * enforces one entry per ID in phetio.addInstance
     *
     * This is used to register instances with PhET-iO.
     * @param {Object} instance - the instance to add
     * @param {Object} options - tandem flags, see phetio.js, must include the phetioType (so technically is not optional)
     * @public
     */
    addInstance: function( instance, options ) {

      if ( PHET_IO_ENABLED && this.enabled ) {

        var type = options.phetioType;

        // Throw an error if the tandem is required but not supplied
        if ( phet.phetio.queryParameters.phetioValidateTandems ) {
          assert && assert( !( this.required && !this.supplied ), 'Tandem was required but not supplied' );
        }

        // ValidateTandems is false and printMissingTandems flag is present for a tandem that is required but not supplied.
        if ( phet.phetio.queryParameters.printMissingTandems && ( this.required && !this.supplied ) ) {
          console.log( 'Required Tandem not supplied.\n' +
                       'this.id = ' + this.id + '\n' +
                       'Stack trace: ' + new Error().stack );
        }

        // ifphetio returns a no-op function, so to test whether a valid "T" wrapper type was passed, we search for the typeName
        if ( this.supplied ) {
          assert && assert( type && type.typeName, 'type must be specified and have a typeName for ' + this.id );
        }

        // If tandem is optional, then don't add the instance
        if ( !this.required && !this.supplied ) {
          if ( phet.phetio.queryParameters.printMissingTandems ) {
            var stackTrace = new Error().stack;

            // Generally Font is not desired because there are so many untandemized instances.
            if ( stackTrace.indexOf( 'PhetFont' ) === -1 ) {
              console.log( 'Optional Tandem not supplied.\n' +
                           'this.id = ' + this.id + '\n' +
                           'Stack trace: ' + stackTrace );
            }
          }

          // For optionally instrumented types that are not provided tandems, the instance isn't really "added"
          // but likewise, it in not an error
          return;
        }

        if ( !launched ) {
          bufferedInstances.push( { tandem: this, instance: instance, options: options } );
        }
        else {
          for ( var i = 0; i < instanceListeners.length; i++ ) {
            instanceListeners[ i ].addInstance( this.id, instance, type, options );
          }
        }
      }
    },

    /**
     * Removes an instance from the registry
     * @param {Object} instance - the instance to remove
     * @public
     */
    removeInstance: function( instance ) {
      if ( !this.required && !this.supplied ) {
        return;
      }

      // Only active when running as phet-io
      if ( PHET_IO_ENABLED && this.enabled ) {
        for ( var i = 0; i < instanceListeners.length; i++ ) {
          instanceListeners[ i ].removeInstance( this.id, instance );
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

      var string = ( this.id.length > 0 ) ? ( this.id + '.' + id ) : id;

      // Any child of something should be passed all inherited options. Make sure that this extend call includes all
      // that make sense from the constructor's extend call.
      options = _.extend( {
        enabled: this.enabled,
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
     * In this case, 'sim.screen.model.electron' is the group tandem id.
     *
     * Used for arrays, observable arrays, or when many elements of the same type are created and they do not otherwise
     * have unique identifiers.
     * @param id
     * @returns {GroupTandem}
     * @public
     */
    createGroupTandem: function( id ) {

      // Unfortunately we must resort to globals here since loading through the namespace would create a cycle
      return new GroupTandem( this.id + '.' + id );
    },

    /**
     * Get the last part of the tandem (after the last .), used in Joist for creating button names dynamically based
     * on screen names
     * @returns {string} the tail of the tandem
     * @public
     */
    get tail() {
      assert && assert( this.id.indexOf( '.' ) >= 0, 'tandem ID does not have a tail' );

      var lastIndexOfDot = this.id.lastIndexOf( '.' );
      var tail = this.id.substring( lastIndexOfDot + 1 );
      assert && assert( tail.length > 0, 'tandem ID did not have a tail' );
      return tail;
    },

    /**
     * Returns a Tandem for everything except the tail.
     * @returns {Tandem}
     * @public
     */
    get parentTandem() {
      assert && assert( this.id.indexOf( '.' ) >= 0, 'tandem ID does not have a tail' );

      var lastIndexOfDot = this.id.lastIndexOf( '.' );
      var headID = this.id.substring( 0, lastIndexOfDot );

      return new Tandem( headID, {
        required: this.required,
        supplied: this.supplied,
        enabled: this.enabled
      } );
    },

    /**
     * Return true if this tandem is legal and can be used by the phet-io system.
     * @returns {boolean}
     * @public
     */
    isLegalAndUsable: function() {

      // If we are not in phet-io mode, then the tandem is not legal and usable.
      if ( !PHET_IO_ENABLED ) {
        return false;
      }

      // A tandem is legal if it has been supplied. Unsupplied tandems are not usable.
      return this.supplied;
    }
  }, {

    /**
     * Adds a listener that will be notified when items are registered/deregistered
     * Listeners have the form
     * {
     *   addInstance(id,instance),
     *   removeInstance(id,instance)
     * }
     * where id is of type {string} and instance is of type {Object}
     *
     * @param {Object} instanceListener - described above
     * @public
     * @static
     */
    addInstanceListener: function( instanceListener ) {
      instanceListeners.push( instanceListener );
    },

    /**
     * When all listeners are listening, all buffered instances are registered.
     * @public
     * @static
     */
    launch: function() {
      assert && assert( !launched, 'Tandem was launched twice' );
      launched = true;
      while ( bufferedInstances.length > 0 ) {
        var tandem = bufferedInstances.shift();
        tandem.tandem.addInstance( tandem.instance, tandem.options );
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
        if ( phet.phetio.queryParameters.phetioValidateTandems ) {
          assert && assert( false, 'Uninstrumented code detected' );
        }

        // Print stack trace if query parameter supplied
        if ( phet.phetio.queryParameters.printMissingTandems ) {
          var stackTrace = new Error().stack;
          console.log( 'Uninstrumented Code! Tandem not supplied: ' + ( uninstrumentedCodeIndex++ ) + '.\n' +
                       'Stack trace: ' + stackTrace );
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
      return PHET_IO_ENABLED && phet.phetio.queryParameters.phetioValidateTandems;
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
   * Some common code (such as CheckBox or RadioButton) must always be instrumented and hence requires a tandem to be
   * passed in.
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.required = Tandem.rootTandem.createTandem( 'requiredTandem', {
    required: true,
    supplied: false
  } );

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
      return new Tandem( this.id + '_' + ( this.groupElementIndex++ ) );
    }
  } );

  return Tandem;
} );