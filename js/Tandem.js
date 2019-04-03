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
  function Tandem( phetioID, options, parent ) {

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

    // #done
    this.parentTandem = parent;

    // @public (read-only)
    this.phetioID = ( phetioID !== undefined ) ? phetioID : '';

    // @private
    this.required = options.required;

    // @public (read-only)
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
     * TODO
     * @param id
     * @param options
     * @returns {{string: {string}, options: {Object}}}
     * @protected
     */
    getStringAndOptions: function( id, options ) {

      // Make sure the id was provided
      assert && assert( typeof id === 'string' && id.length > 0, 'id must be defined' );
      assert && assert( id.indexOf( phetio.PhetioIDUtils.SEPARATOR ) === -1, 'createTandem cannot accept dots: ' + id );
      assert && assert( id.indexOf( ' ' ) === -1, 'createTandem cannot accept whitespace: ' + id );
      assert && assert( id.indexOf( '-' ) === -1, 'createTandem cannot accept dash: ' + id );

      var string = ( this.phetioID.length > 0 ) ? phetio.PhetioIDUtils.append( this.phetioID, id ) : id;

      // Any child of something should be passed all inherited options. Make sure that this extend call includes all
      // that make sense from the constructor's extend call.
      options = _.extend( {
        supplied: this.supplied,
        required: this.required
      }, options );

      return {
        string: string,
        options: options
      };
    },
    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @param {Object} [options]
     * @returns {Tandem}
     * @public
     */
    createTandem: function( id, options ) {
      const stringAndOptions = this.getStringAndOptions( id, options );
      return new Tandem( stringAndOptions.string, stringAndOptions.options, this );
    },

    /**
     * A dynamic phetioID contains text like .................'sim.screen1.particles.particles_7'
     * which corresponds to the prototype "quark" ....
     * This method looks up the corresponding prototype like..'sim.screen1.particles.prototypes.quark'
     *
     * NOTE: This function makes a lot of assumptions about the look of phetioIDs that are made in Group.js, don't change
     * one without consulting the other.
     * @param {GroupMemberTandem} tandem
     * @returns {string}
     * @public
     */
    /**
     * @override
     * @returns {*}
     */
    getConcretePhetioID() {

      const terms = this.phetioID.split( phetio.PhetioIDUtils.SEPARATOR );
      const concreteTerms = terms.map( term => {
        if ( term.match( /[a-zA-Z]+_[0-9]+/ ) ) {

          // create "parent" phetioID that looks like blarg.stuff_number
          // use phetioEngine to get the parent phetioOBject of a dynamic instance
          // use phetioOBject to get its GroupMemberTandem
          // use that to get prototypeName
          return `prototypes${phetio.PhetioIDUtils.SEPARATOR}${this.prototypeName}`;
        }
        else {
          return term;
        }
      } );
      return concreteTerms.join( phetio.PhetioIDUtils.SEPARATOR );
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
     * @param {string} id
     * @param {string} [elementPrefix]
     * @returns {GroupTandem}
     * @deprecated
     * @public
     */
    createGroupTandem: function( id, elementPrefix ) {

      assert && assert( id.indexOf( '.' ) === -1, 'createTandem cannot accept dots: ' + id );
      assert && assert( id.indexOf( ' ' ) === -1, 'createTandem cannot accept whitespace: ' + id );

      return new GroupTandem( phetio.PhetioIDUtils.append( this.phetioID, id ), elementPrefix );
    },

    /**
     * Get the last part of the tandem (after the last .), used in Joist for creating button names dynamically based
     * on screen names
     * @returns {string} the tail of the tandem
     * @public
     */
    get tail() { // TODO: rename to getComponentName()
      return phetio.PhetioIDUtils.getComponentName( this.phetioID );
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
   * @param {string} prefix
   * @constructor
   * @deprecated - see Group.js for the way of the future
   * @private create with Tandem.createGroupTandem
   */
  function GroupTandem( id, prefix ) {

    Tandem.call( this, id );

    // @private for generating indices from a pool
    this.groupElementIndex = 0;

    // @private
    this.prefix = prefix || 'element';
  }

  tandemNamespace.register( 'Tandem.GroupTandem', GroupTandem );

  inherit( Tandem, GroupTandem, {

    /**
     * Creates the next tandem in the group.
     * @returns {Tandem}
     * @public
     */
    createNextTandem: function() {
      return this.createTandem( this.prefix + '_' + ( this.groupElementIndex++ ) );
    }
  } );

  return Tandem;
} );