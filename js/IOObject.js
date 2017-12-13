// Copyright 2017, University of Colorado Boulder

/**
 * Base type for PhET types, provides support for PhET-iO features when running with PhET-iO enabled.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var Tandem = require( 'TANDEM/Tandem' );

  var DEFAULTS = {
    tandem: Tandem.optional,        // By default tandems are optional, but subtypes can specify this as
                                    // `Tandem.tandemRequired` to enforce its presence
    phetioType: ObjectIO,           // Supply the appropriate IO type
    phetioState: true,              // When true, includes the instance in the PhET-iO state
    phetioEvents: true,             // When true, includes events in the PhET-iO events stream
    phetioReadOnly: false,          // When true, you can only get values from the instance; no setting allowed.
    phetioInstanceDocumentation: '' // Useful notes about an instrumented instance, shown in instance-proxies
  };

  var OPTIONS_KEYS = _.keys( DEFAULTS );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function IOObject( options ) {

    options = _.extend( {}, DEFAULTS, options );

    // @public - used to map model tandem names to view objects (by using tandem.tail)
    // TODO: rename to this.tandem after all other this.*tandems deleted
    // TODO: do we need phetioID if we have phetObjectTandem?
    this.phetObjectTandem = options.tandem;

    // @private - the IO type associated with this instance
    this.phetioType = options.phetioType;

    // Register with the tandem registry
    this.phetObjectTandem.addInstance( this, options );

    if ( assert ) {
      this.ioobjectOptions = options; // for error checking during Node.mutate
    }

    // @private - for assertion checking
    this.eventInProgress = false;
  }

  tandemNamespace.register( 'IOObject', IOObject );

  return inherit( Object, IOObject, {

    /**
     * Start an event for the nested PhET-iO event stream.
     *
     * @param {string} eventType - 'model' | 'view'
     * @param {string} event - the name of the event
     * @param {Object} [args] - arguments for the event
     * @returns {number}
     * @public
     */
    startEvent: function( eventType, event, args ) {
      assert && assert( !this.eventInProgress, 'cannot start event while event is in progress' );
      this.eventInProgress = true;
      var id = this.phetObjectTandem.id;
      return this.phetObjectTandem.isLegalAndUsable() && phetioEvents.start( eventType, id, this.phetioType, event, args );
    },

    /**
     * End an event on the nested PhET-iO event stream.
     * @param {number} id
     * @public
     */
    endEvent: function( id ) {
      assert && assert( this.eventInProgress, 'cannot end an event that hasn\'t started' );
      this.phetObjectTandem.isLegalAndUsable() && phetioEvents.end( id );
      this.eventInProgress = false;
    },

    /**
     * Unregisters from tandem when longer used.
     * @public
     */
    dispose: function() {
      assert && assert( !this.eventInProgress, 'cannot dispose while event is in progress' );

      // Tandem de-registration
      this.phetObjectTandem.removeInstance( this );
    },

    /**
     * A debugging method that helps us ensure we didn't miss any PhET-iO metadata while transitioning to the Node extends
     * IOObject pattern.  Only called when assertions are enabled.
     * @param {Object} options
     * @protected
     */
    checkOptions: function( options ) {

      if ( !options ) {

        // cannot be inconsistent if not provided
        return;
      }
      var self = this;

      // Make sure that if any phet-io options are provided, they match the options provided in the constructor
      _.keys( DEFAULTS ).forEach( function( key ) {
        if ( options.hasOwnProperty( key ) ) {
          assert && assert( self.ioobjectOptions, 'options should have been provided' );
          assert && assert( options[ key ] === self.ioobjectOptions[ key ], 'mismatched option: ' + key );
        }
      } );
    }
  }, {

    OPTIONS_KEYS: OPTIONS_KEYS,

    getOptions: function( options ) {
      return _.pick( options, OPTIONS_KEYS );
    }
  } );
} );