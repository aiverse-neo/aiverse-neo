using Neo;
using Neo.SmartContract;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;
using System;


namespace Aiverse
{
    [SupportedStandards("NEP-11")]
    public class Aiverse : Nep11Token<AiverseTokenState>
    {

        [InitialValue("NgX1q7tRtEDRrQyBgeXJe4Tzhf51yFkQtb", ContractParameterType.Hash160)]
        static readonly UInt160 Owner = default;

        [InitialValue("0275b0e03566c6571f826c90b4f9ac1ef65e8fb2b73d9242729d312ea2cad330ca", ContractParameterType.ByteArray)]
        private static readonly ByteString bytePubkey = default;

        private static bool IsOwner() => Runtime.CheckWitness(Owner);

        public override string Symbol() => "DEMONFT";

        public static string AiverseMint(
            UInt160 to,
            ByteString message,
            ByteString signature
            )
        {
            // if (!IsOwner()) throw new Exception("No authorization.");
            if (!to.IsValid) throw new Exception("Receiver is invalid.");
            // Verif signature
            bool verify = CryptoLib.VerifyWithECDsa(message, (Neo.Cryptography.ECC.ECPoint)bytePubkey, signature, (NamedCurve)23);
            if (!verify) throw new Exception("Failed verification.");
            var messageX = (Map<string, string>)StdLib.JsonDeserialize(message);
            Mint(messageX["name"], new AiverseTokenState(to, messageX["name"], messageX["image"], messageX["offLineId"], messageX["type"], messageX["fileMD5"], messageX["info"]));
            return messageX["name"];
        }

        public override Map<string, object> Properties(ByteString tokenId){
            var properties = (Map<string, object>)base.Properties(tokenId);
            AiverseTokenState val = (AiverseTokenState)StdLib.Deserialize(new StorageMap(Storage.CurrentContext, 3)[tokenId]);
            string image = val.Image;
            properties["image"] = image;
            string type = val.Type;
            properties["type"] = type;
            string offLineId = val.OffLineId;
            properties["offLineId"] = offLineId;
            string fileMD5 = val.FileMD5;
            properties["fileMD5"] = fileMD5;
            string info = val.Info;
            properties["info"] = info;
            return properties;
        }


        public static void Destroy()
        {
            if (!IsOwner()) throw new Exception("No authorization.");
            ContractManagement.Destroy();
        }

        public static void Update(ByteString nefFile, string manifest)
        {
            if (!IsOwner()) throw new Exception("No authorization.");
            ContractManagement.Update(nefFile, manifest, null);
        }
    }

    public class MessageInfo
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Image { get; set; }
        public string FileMD5 { get; set; }
        public string OffLineId { get; set; }
        public string Info { get; set; }
    }

    public class AiverseTokenState : Nep11TokenState
    {
        public string Image { get; set; }

        public string FileMD5 { get; set; }

        public string OffLineId { get; set; }

        public string Type { get; set; }

        public string Info { get; set; }

        public AiverseTokenState(
            UInt160 to,
            string name,
            string image,
            string offLineId,
            string type,
            string fileMD5,
            string info
            )
        {
            Image = image;
            Name = name;
            Owner = to;
            OffLineId = offLineId;
            Type = type;
            FileMD5 = fileMD5;
            Info = info;
        }
    }
}
