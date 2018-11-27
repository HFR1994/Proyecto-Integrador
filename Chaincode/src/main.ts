import Chaincode from './pi';
import shim from "fabric-shim";

shim.start(new Chaincode());

