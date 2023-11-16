// Copyright 2023, University of Colorado Boulder

/**
 * A list that stores all parametric IOType caches. This is predominantly used to clear an API and start over in phetioEngine.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import IOType from './types/IOType.js';

type IOTypeCache = Map<IntentionalAny, IOType>;

class IOTypeCaches {
  private readonly caches: IOTypeCache[] = [];

  public register( cache: IOTypeCache ): void {
    this.caches.push( cache );
  }

  public clearAll(): void {
    this.caches.forEach( cache => cache.clear() );
  }
}

const ioTypeCaches = new IOTypeCaches();
export default ioTypeCaches;