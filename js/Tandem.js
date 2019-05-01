// Copyright 2015-2019, University of Colorado Boulder

/**
 * Tandem is used to assign unique identifiers to PhetioObjects in PhET simulations and register/unregister them in a
 * registry. It is used to support PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const toCamelCase = require( 'PHET_CORE/toCamelCase' );

  // text
  const packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  const packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so requiring packageJSON doesn't work
  const PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );
  const GROUP_SEPARATOR_TOKEN = phetio.PhetioIDUtils.GROUP_SEPARATOR_TOKEN;

  // used to keep track of missing tandems, see phet.phetio.queryParameters.phetioPrintMissingTandems
  const missingTandems = {
    required: [],
    optional: [],
    uninstrumented: []
  };

  // Listeners that will be notified when items are registered/deregistered. See doc in addPhetioObjectListener
  const phetioObjectListeners = [];

  // variables
  // Before listeners are wired up, tandems are buffered.  When listeners are wired up, Tandem.launch() is called
  // and buffered tandems are flushed, then subsequent tandems are delivered to listeners directly
  let launched = false;
  const bufferedPhetioObjects = [];

  class Tandem {

    /**
     * Typically, sims will create tandems using `tandem.createTandem`.  This constructor is used internally or when
     * a tandem must be created from scratch.
     *
     * @param {Tandem|null} parentTandem - parent for a child tandem, or null for a root tandem
     * @param {string} name - component name for this level, like 'resetAllButton'
     * @param {Object} [options]
     */
    constructor( parentTandem, name, options ) {
      assert && assert( parentTandem === null || parentTandem instanceof Tandem, 'parentTandem should be null or Tandem' );

      assert && assert( typeof name === 'string' && name.length > 0, 'name must be defined' );
      assert && assert( name.indexOf( phetio.PhetioIDUtils.SEPARATOR ) === -1, 'createTandem cannot accept dots: ' + name );
      assert && assert( name.indexOf( '-' ) === -1, 'createTandem cannot accept dash: ' + name );
      assert && assert( name.indexOf( ' ' ) === -1, 'name cannot contain whitespace: ' + name );

      // options (even subtype options) must be stored on the instance so they can be passed through to children
      // Note: Make sure that added options here are also added to options for inheritance and/or
      // for composition (createTandem/parentTandem) as they make sense.
      options = _.extend( {

        // if the tandem is not supplied and required, an error will be thrown.
        supplied: true,

        // required === false means it is an optional tandem
        required: true
      }, options );

      // @public (read-only) {Tandem|null}
      this.parentTandem = parentTandem;

      // @public (read-only)
      this.name = name;

      // @public (read-only)
      this.phetioID = this.parentTandem ? phetio.PhetioIDUtils.append( this.parentTandem.phetioID, this.name ) : this.name;

      // @private
      this.required = options.required;

      // @public (read-only)
      this.supplied = options.supplied;
    }

    /**
     * Adds a PhetioObject.  For example, it could be an axon Property, scenery Node or Sun button.  Each item should
     * only be added to the registry once, but that is not enforced here in Tandem.  For PhET-iO, phetioEngine.js
     * enforces one entry per ID in phetio.phetioObjectAdded
     *
     * This is used to register PhetioObjects with PhET-iO.
     * @param {PhetioObject} phetioObject
     * @public
     */
    addPhetioObject( phetioObject ) {
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
            const stackTrace = new Error().stack;

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
          for ( let i = 0; i < phetioObjectListeners.length; i++ ) {
            phetioObjectListeners[ i ].addPhetioObject( phetioObject );
          }
        }
      }
    }

    /**
     * Removes an instance from the registry
     * @param {PhetioObject} phetioObject - the instance to remove
     * @public
     */
    removeInstance( phetioObject ) {
      if ( !this.required && !this.supplied ) {
        return;
      }

      // Only active when running as phet-io
      if ( PHET_IO_ENABLED ) {
        for ( let i = 0; i < phetioObjectListeners.length; i++ ) {
          phetioObjectListeners[ i ].removePhetioObject( phetioObject );
        }
      }
    }

    /**
     * Used for creating new tandems, extends this Tandem's options with the passed-in options.
     * @param {Object} [options]
     * @returns {Object} -extended options
     * @protected
     */
    getExtendedOptions( options ) {

      // Any child of something should be passed all inherited options. Make sure that this extend call includes all
      // that make sense from the constructor's extend call.
      return _.extend( {
        supplied: this.supplied,
        required: this.required
      }, options );
    }

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @param {Object} [options]
     * @returns {Tandem}
     * @public
     */
    createTandem( id, options ) {

      // This assertion isn't in the constructor because a subtype of Tandem allows this character.
      assert && assert( id.indexOf( GROUP_SEPARATOR_TOKEN ) === -1,
        `invalid character in non-group tandem: ${GROUP_SEPARATOR_TOKEN}` );

      return new Tandem( this, id, this.getExtendedOptions( options ) );
    }

    /**
     * Tacks on this Tandem's suffix to the given parentPhetioID, used to look up concrete phetioIDs
     * @param {string} parentPhetioID
     * @returns {string}
     * @protected
     */
    appendConcreteSuffix( parentPhetioID ) {
      return phetio.PhetioIDUtils.append( parentPhetioID, this.name );
    }

    /**
     * A dynamic phetioID contains text like .................'sim.screen1.particles.particles_7.visibleProperty'
     * which corresponds to the prototype "quark" ....
     * This method looks up the corresponding prototype like..'sim.screen1.particles.prototypes.quark.visibleProperty'
     *
     * NOTE: This function makes a lot of assumptions about the look of phetioIDs that are made in Group.js, don't change
     * one without consulting the other.
     * @returns {string}
     * @public
     */
    getConcretePhetioID() {

      // Dynamic elements always have a parent container, hence since this does not have a parent, it must already be concrete
      return this.parentTandem ? this.appendConcreteSuffix( this.parentTandem.getConcretePhetioID() ) : this.phetioID;
    }

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
    createGroupTandem( id, elementPrefix ) {

      assert && assert( id.indexOf( '.' ) === -1, 'createGroupTandem cannot accept dots: ' + id );
      assert && assert( id.indexOf( ' ' ) === -1, 'createGroupTandem cannot accept whitespace: ' + id );

      return new GroupTandem( this, id, elementPrefix );
    }

    /**
     * Get the last part of the tandem (after the last .), used in Joist for creating button names dynamically based
     * on screen names
     * @returns {string} the tail of the tandem
     * @public
     */
    get tail() { // TODO: rename to getComponentName()
      return phetio.PhetioIDUtils.getComponentName( this.phetioID );
    }

    /**
     * The Tandem base class is not a GroupMemberTandem, but GroupMemberTandem overrides this function to specify
     * that it is dynamic. If effect this function is a replacement for checking `x instanceof GroupMemberTandem` in
     * the Tandem base class.
     * @returns {boolean}
     * @protected
     */
    isGroupMember() {
      return false;
    }

    /**
     * Whether this tandem is a GroupMemberTandem or if any parents are. If this is the case, then this tandem is dynamic.
     * @returns {boolean}
     * @public
     */
    isGroupMemberOrDescendant() {
      return this.isGroupMember() || ( !!this.parentTandem && this.parentTandem.isGroupMember() );
    }

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
    static addPhetioObjectListener( phetioObjectListener ) {
      phetioObjectListeners.push( phetioObjectListener );
    }

    /**
     * When all listeners are listening, all buffered PhetioObjects are registered.
     * @public
     * @static
     */
    static launch() {
      assert && assert( !launched, 'Tandem was launched twice' );
      launched = true;
      while ( bufferedPhetioObjects.length > 0 ) {
        const phetioObject = bufferedPhetioObjects.shift();
        phetioObject.register();
      }
    }

    /**
     * Catch cases where tandem is being supplied to a class that doesn't support tandem.
     * @param {Object} [options]
     * @public
     * @static
     */
    static disallowTandem( options ) {
      if ( Tandem.validationEnabled() ) {
        assert && assert( !options.tandem, 'tandem is not allowed' );
      }
    }

    /**
     * When running in PhET-iO brand, some code (such as user interface components) must be instrumented for PhET-iO.
     * Uninstrumented files should call this function to indicate they still need to be instrumented, so they aren't
     * missed.  See https://github.com/phetsims/phet-io/issues/668
     * @public
     * @static
     */
    static indicateUninstrumentedCode() {

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
    }

    /**
     * Determine whether or not tandem validation is turned on for the sim.
     * @returns {Boolean} If tandems are being validated or not.
     * @public
     * @static
     */
    static validationEnabled() {
      return PHET_IO_ENABLED &&
             phet.phetio.queryParameters.phetioValidateTandems &&

             // If we are printing the missing tandems, then validation must be disabled because the intention is to
             // run with partial tandem coverage and see which are missing.
             !phet.phetio.queryParameters.phetioPrintMissingTandems;
    }
  }

  // The next few statics are created outside the static block because they instantiate Tandem instances.

  /**
   * The root tandem for a simulation
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.rootTandem = new Tandem( null, toCamelCase( packageJSON.name ) );

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

  // TODO: Replace GroupTandem usages with GroupMemberTandem, see https://github.com/phetsims/tandem/issues/87
  class GroupTandem extends Tandem {

    /**
     * Group Tandem -- Declared in the same file to avoid circular reference errors in module loading.
     * @param {Tandem} parentTandem
     * @param {string} id - id as a string (or '' for a root id)
     * @param {string} prefix
     * @constructor
     * @deprecated - see Group.js for the way of the future
     * @private create with Tandem.createGroupTandem
     */
    constructor( parentTandem, id, prefix ) {

      super( parentTandem, id );

      // @private for generating indices from a pool
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix || 'element';
    }

    /**
     * Creates the next tandem in the group.
     * @returns {Tandem}
     * @public
     */
    createNextTandem() {
      return this.createTandem( this.prefix + '~' + ( this.groupElementIndex++ ) );
    }
  }

  return tandemNamespace.register( 'Tandem', Tandem );
} );