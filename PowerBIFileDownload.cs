using SourceCode.SmartObjects.Services.ServiceSDK;
using SourceCode.SmartObjects.Services.ServiceSDK.Objects;
using SourceCode.SmartObjects.Services.ServiceSDK.Types;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;
using Attributes = SourceCode.SmartObjects.Services.ServiceSDK.Attributes;

namespace PowerBIFileDownload
{
    [Attributes.ServiceObject("PowerBIReportDownload", "Power BI Report Download", "This is a custom service to download a Power BI report file.")]
    public class PowerBIFileDownloadClass : ServiceAssemblyBase
    {
        private Guid _groupId;
        private Guid _reportId; 
        private string _exportId;
        private string _outputFileAsString;
        private string _contentLength;
        private string _responseCode;
        private string _token;

        #region Public Properties

        [Attributes.Property("GroupId", SoType.Guid, "Group ID", "")]
        public Guid GroupId
        {
            get { return _groupId;}
            set { _groupId = value; }
        }

        [Attributes.Property("ReportId", SoType.Guid, "Report ID", "")]
        public Guid ReportId
        {
            get { return _reportId; }
            set { _reportId = value; }
        }

        [Attributes.Property("ExportId", SoType.Text, "Export ID", "")]
        public string ExportId
        {
            get { return _exportId; }
            set { _exportId = value; }
        }

        [Attributes.Property("OutputFileAsString", SoType.Text, "Output File As String", "")]
        public string OutputFileAsString
        {
            get { return _outputFileAsString; }
            set { _outputFileAsString = value; }
        }

        [Attributes.Property("ContentLength", SoType.Text, "Content Length", "")]
        public string ContentLength
        {
            get { return _contentLength; }
            set { _contentLength = value; }
        }

        [Attributes.Property("ResponseCode", SoType.Text, "Response Code", "")]
        public string ResponseCode
        {
            get { return _responseCode; }
            set { _responseCode = value; }
        }

        [Attributes.Property("Token", SoType.Text, "Auth Token", "")]
        public string Token
        {
            get { return _token; }
            set { _token = value; }
        }

        #endregion

        #region Methods

        /// <summary>
        /// created to return a whole instance of this class. (As implemented in the time sample broker) 
        /// I suspect this is where I'm messing up.
        /// </summary>
        /// <returns></returns>
        [Attributes.Method("DownloadPowerBiReport", MethodType.List, "Download Power Bi Report", "Downloads a report from PowerBi as a memo",
        new string[] { "GroupId", "ReportId", "ExportId" },
        new string[] { "GroupId", "ReportId", "ExportId" },
        new string[] { "OutputFileAsString", "ResponseCode", "ContentLength", "Token" })]
        public PowerBIFileDownloadClass GetFileDownload()
        {
            PowerBIFileDownloadClass pbFile = new PowerBIFileDownloadClass();
            pbFile.GroupId = GroupId;
            pbFile.ReportId = ReportId;
            pbFile.ExportId = ExportId;
            pbFile.Token = base.Service.ServiceConfiguration.ServiceAuthentication.OAuthToken;
            Console.WriteLine(pbFile.Token);
            Console.WriteLine("GroupID: " + pbFile.GroupId);
            pbFile = DownloadReportAsync(pbFile).GetAwaiter().GetResult();
            //pbFile = dlHolder.Result;
            return pbFile;

        }
        
        /// <summary>
        /// Downloads a PBIX file from Power BI REST API.
        /// </summary>
        /// <param name="workspaceId">The workspace (group) GUID.</param>
        /// <param name="reportId">The report GUID.</param>
        /// <param name="exportId">The Export ID.</param>
        public async Task<PowerBIFileDownloadClass> DownloadReportAsync(PowerBIFileDownloadClass pbfdc)
        {
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pbfdc.Token);

                var url = $"https://api.powerbi.com/v1.0/myorg/groups/{pbfdc.GroupId}/reports/{pbfdc.ReportId}/exports/{pbfdc.ExportId}/file";
                var response = await client.GetAsync(url);

                //response.EnsureSuccessStatusCode();
                pbfdc.ResponseCode = response.StatusCode.ToString();
                pbfdc.ContentLength = response.Content.Headers.ContentLength.ToString();

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    using (MemoryStream fs = new MemoryStream())
                    {
                        await response.Content.CopyToAsync(fs);
                        pbfdc.OutputFileAsString = ConvertOctetStreamToBase64(fs);
                    }
                    
                }

                else
                {
                    OutputFileAsString = "";
                }

                return pbfdc;
            }
            
        }
        /// <summary>
        /// Converts file from a stream to a base 64 string to be consumed by K2
        /// </summary>
        /// <param name="octetStream"></param>
        /// <returns>Base64String</returns>
        public static string ConvertOctetStreamToBase64(Stream octetStream)
        {
            // Ensure the stream is at the beginning
            octetStream.Seek(0, SeekOrigin.Begin);

            // Read the entire stream into a byte array
            byte[] bytes;
            using (MemoryStream ms = new MemoryStream())
            {
                octetStream.CopyTo(ms);
                bytes = ms.ToArray();
            }

            // Convert the byte array to a Base64 string
            string base64String = Convert.ToBase64String(bytes);
            return base64String;
        }

        #endregion

        #region Service Broker Implementation Methods (Override base class methods)

        //Used by K2 when refreshing the service instance

        #region override string DescribeSchema()

        public override string DescribeSchema()
        {
            try
            {
                this.Service.ServiceObjects.Create(new ServiceObject(typeof(PowerBIFileDownload.PowerBIFileDownloadClass)));

                //set up the default values for the service instance
                /*this.Service.Name = "PowerBIReportDownload";
                this.Service.MetaData.DisplayName = "Power BI Report Download";
                this.Service.MetaData.Description = "This is a custom service to download a Power BI report file.";*/

                // Indicate that the operation was successful.
                ServicePackage.IsSuccessful = true;
            }

            catch (Exception ex)
            {
                // Record the exception message and indicate that this was an error.
                ServicePackage.ServiceMessages.Add(ex.Message, MessageSeverity.Error);
                // Indicate that the operation was unsuccessful.
                ServicePackage.IsSuccessful = false;
            }

            return base.DescribeSchema();
        }
        #endregion

        #region override void Extend()
        /// <summary>
        /// Extends the underlying system or technology's schema. This is only implemented for K2 SmartBox.
        /// </summary>
        public override void Extend()
        {
            try
            {
                throw new NotImplementedException("Service Object \"Extend()\" is not implemented.");
            }
            catch (Exception ex)
            {
                // Record the exception message and indicate that this was an error.
                ServicePackage.ServiceMessages.Add(ex.Message, MessageSeverity.Error);
                // Indicate that the operation was unsuccessful.
                ServicePackage.IsSuccessful = false;
            }
        }
        #endregion

        #endregion
    }

}
